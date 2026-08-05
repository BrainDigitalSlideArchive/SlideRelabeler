#include <pybind11/pybind11.h>
#include <pybind11/stl.h>

#include <libCZI.h>

#include <algorithm>
#include <cstring>
#include <memory>
#include <random>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#if defined(_WIN32)
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#endif

namespace py = pybind11;

namespace {

std::wstring utf8_to_wstring(const std::string& utf8) {
#if defined(_WIN32)
  if (utf8.empty()) {
    return std::wstring();
  }
  const int size = MultiByteToWideChar(CP_UTF8, 0, utf8.c_str(), -1, nullptr, 0);
  if (size <= 0) {
    throw std::runtime_error("Failed to convert path to wide string");
  }
  std::wstring out(static_cast<size_t>(size - 1), L'\0');
  MultiByteToWideChar(CP_UTF8, 0, utf8.c_str(), -1, &out[0], size);
  return out;
#else
  // libCZI file APIs take wchar_t*; on macOS/Linux paths are typically UTF-8 bytes
  // that fit in wchar_t as char-widen (ASCII / latin paths). Prefer this simple
  // widen for app paths which are filesystem-native.
  return std::wstring(utf8.begin(), utf8.end());
#endif
}

libCZI::GUID make_guid() {
  libCZI::GUID guid{};
  std::random_device rd;
  std::mt19937_64 gen(rd());
  std::uniform_int_distribution<std::uint64_t> dist;
  const std::uint64_t a = dist(gen);
  const std::uint64_t b = dist(gen);
  std::memcpy(&guid, &a, sizeof(a));
  std::memcpy(reinterpret_cast<char*>(&guid) + sizeof(a), &b, sizeof(b));
  return guid;
}

struct AttachmentPayload {
  std::string name;
  std::string content_file_type;
  std::string data;
};

void replace_or_add_attachments_impl(
    const std::string& path,
    const std::vector<AttachmentPayload>& payloads) {
  if (payloads.empty()) {
    return;
  }

  const auto wpath = utf8_to_wstring(path);
  auto stream = libCZI::CreateInputOutputStreamForFile(wpath.c_str());
  if (!stream) {
    throw std::runtime_error("Failed to open CZI for read/write: " + path);
  }

  auto reader_writer = libCZI::CreateCZIReaderWriter();
  reader_writer->Create(stream);

  for (const auto& payload : payloads) {
    if (payload.data.size() > static_cast<size_t>(UINT32_MAX)) {
      throw std::runtime_error("Attachment payload too large: " + payload.name);
    }

    int found_index = -1;
    libCZI::GUID found_guid = make_guid();
    bool have_guid = false;
    reader_writer->EnumerateAttachments(
        [&](int index, const libCZI::AttachmentInfo& info) {
          if (info.name == payload.name) {
            found_index = index;
            found_guid = info.contentGuid;
            have_guid = true;
            return false;
          }
          return true;
        });

    libCZI::AddAttachmentInfo add_info;
    add_info.Clear();
    add_info.contentGuid = have_guid ? found_guid : make_guid();
    add_info.SetName(payload.name.c_str());
    add_info.SetContentFileType(payload.content_file_type.c_str());
    add_info.ptrData = payload.data.data();
    add_info.dataSize = static_cast<std::uint32_t>(payload.data.size());

    if (found_index >= 0) {
      reader_writer->ReplaceAttachment(found_index, add_info);
    } else {
      reader_writer->SyncAddAttachment(add_info);
    }
  }

  reader_writer->Close();
}

void replace_or_add_attachment(
    const std::string& path,
    const std::string& name,
    const std::string& content_file_type,
    const py::bytes& data) {
  char* buffer = nullptr;
  py::ssize_t length = 0;
  if (PYBIND11_BYTES_AS_STRING_AND_SIZE(data.ptr(), &buffer, &length)) {
    throw std::runtime_error("Invalid attachment bytes");
  }
  if (length < 0) {
    throw std::runtime_error("Invalid attachment bytes length");
  }
  AttachmentPayload payload;
  payload.name = name;
  payload.content_file_type = content_file_type;
  payload.data.assign(buffer, buffer + length);
  replace_or_add_attachments_impl(path, {std::move(payload)});
}

void replace_or_add_attachments(const std::string& path, const py::list& items) {
  std::vector<AttachmentPayload> payloads;
  payloads.reserve(static_cast<size_t>(py::len(items)));
  for (const auto& handle : items) {
    const auto item = py::reinterpret_borrow<py::dict>(handle);
    AttachmentPayload payload;
    payload.name = py::cast<std::string>(item["name"]);
    payload.content_file_type = py::cast<std::string>(item["content_file_type"]);
    const py::bytes data = py::cast<py::bytes>(item["data"]);
    char* buffer = nullptr;
    py::ssize_t length = 0;
    if (PYBIND11_BYTES_AS_STRING_AND_SIZE(data.ptr(), &buffer, &length)) {
      throw std::runtime_error("Invalid attachment bytes for " + payload.name);
    }
    if (length < 0) {
      throw std::runtime_error("Invalid attachment bytes length for " + payload.name);
    }
    payload.data.assign(buffer, buffer + length);
    payloads.push_back(std::move(payload));
  }
  replace_or_add_attachments_impl(path, payloads);
}

std::vector<std::string> list_attachment_names(const std::string& path) {
  const auto wpath = utf8_to_wstring(path);
  auto stream = libCZI::CreateStreamFromFile(wpath.c_str());
  auto reader = libCZI::CreateCZIReader();
  reader->Open(stream);
  std::vector<std::string> names;
  reader->EnumerateAttachments(
      [&](int /*index*/, const libCZI::AttachmentInfo& info) {
        names.push_back(info.name);
        return true;
      });
  reader->Close();
  return names;
}

}  // namespace

PYBIND11_MODULE(_sliderelabeler_czi_rw, m) {
  m.doc() = "libCZI ReplaceAttachment / SyncAddAttachment for SlideRelabeler";
  m.def(
      "replace_or_add_attachment",
      &replace_or_add_attachment,
      py::arg("path"),
      py::arg("name"),
      py::arg("content_file_type"),
      py::arg("data"),
      "Replace an existing named attachment or add it if missing.");
  m.def(
      "replace_or_add_attachments",
      &replace_or_add_attachments,
      py::arg("path"),
      py::arg("items"),
      "Replace or add multiple named attachments in one open/close session. "
      "Each item is a dict with keys name, content_file_type, data.");
  m.def(
      "list_attachment_names",
      &list_attachment_names,
      py::arg("path"),
      "List attachment names in a CZI file.");
}

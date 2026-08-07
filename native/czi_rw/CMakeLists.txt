cmake_minimum_required(VERSION 3.15)
project(sliderelabeler_czi_rw LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Python extensions on Windows must use the shared CRT (/MD).
if(POLICY CMP0091)
  cmake_policy(SET CMP0091 NEW)
endif()
if(MSVC)
  set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>DLL" CACHE STRING "" FORCE)
endif()

# Build a minimal static libCZI (no tests, curl, cmd, dynlib).
set(LIBCZI_BUILD_UNITTESTS OFF CACHE BOOL "" FORCE)
set(LIBCZI_BUILD_CZICMD OFF CACHE BOOL "" FORCE)
set(LIBCZI_BUILD_CURL_BASED_STREAM OFF CACHE BOOL "" FORCE)
set(LIBCZI_BUILD_AZURESDK_BASED_STREAM OFF CACHE BOOL "" FORCE)
set(LIBCZI_BUILD_DYNLIB OFF CACHE BOOL "" FORCE)
set(LIBCZI_ENABLE_INSTALL OFF CACHE BOOL "" FORCE)
set(LIBCZI_BUILD_LIBCZIAPI OFF CACHE BOOL "" FORCE)
# Let this project control MSVC runtime (/MD) instead of libCZI's /MT default.
set(LIBCZI_DO_NOT_SET_MSVC_RUNTIME_LIBRARY ON CACHE BOOL "" FORCE)

add_subdirectory(third_party/libczi EXCLUDE_FROM_ALL)

find_package(pybind11 CONFIG REQUIRED)

pybind11_add_module(_sliderelabeler_czi_rw src/bindings.cpp)

target_link_libraries(_sliderelabeler_czi_rw PRIVATE libCZIStatic)
target_include_directories(_sliderelabeler_czi_rw PRIVATE
  ${CMAKE_CURRENT_SOURCE_DIR}/third_party/libczi/Src/libCZI
)

# Install into the Python package path when built via pip/scikit-build.
install(TARGETS _sliderelabeler_czi_rw DESTINATION .)

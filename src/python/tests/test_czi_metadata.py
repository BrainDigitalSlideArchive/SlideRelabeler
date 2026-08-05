"""Unit tests for CZI metadata scrub helpers (no pylibCZIrw required)."""

from src.python.DeidTools.czi_metadata import (
    apply_czi_redact_list_to_xml,
    flatten_czi_fields_to_fake_ifds,
    pretty_print_czi_xml,
    sanitize_czi_metadata_xml,
)
from src.python.DeidTools.wsi_deid_process import (
    determine_format,
    get_standard_redactions_format_czi,
    generate_system_redaction_list_entry,
)
from src.python.DeidTools import DeidTools


SAMPLE_XML = """<?xml version="1.0"?>
<ImageDocument>
  <Metadata>
    <Information>
      <Document>
        <Name>PatientSlide</Name>
        <Title>Old Title</Title>
        <UserName>jdoe</UserName>
        <Description>phi desc</Description>
        <Comment>secret</Comment>
        <Keywords>mrn123</Keywords>
        <CreationDate>2022-10-05T12:00:00Z</CreationDate>
      </Document>
      <Image>
        <AcquisitionDateAndTime>2022-10-05T15:06:46.278368Z</AcquisitionDateAndTime>
        <SizeX>100</SizeX>
      </Image>
      <Patient>
        <Id>MRN-999</Id>
        <Name>Alice</Name>
      </Patient>
    </Information>
    <Scaling>
      <Items>
        <Distance Id="X">
          <Value>2.5e-07</Value>
        </Distance>
      </Items>
    </Scaling>
    <Dimensions>
      <Channels>
        <Channel Id="Channel:0">
          <PixelType>Gray8</PixelType>
        </Channel>
      </Channels>
    </Dimensions>
    <CustomAttributes>
      <Secret>leak</Secret>
    </CustomAttributes>
    <AutoSave>
      <ImageName>D:\\Users\\Sharma Lab\\WeiChen\\2022_10_05__0118.czi</ImageName>
      <SingleFileSaveDestinationFolder>D:\\zeiss\\Pictures</SingleFileSaveDestinationFolder>
      <SingleFileName>New</SingleFileName>
      <StorageFolder>D:\\zeiss\\Pictures</StorageFolder>
    </AutoSave>
    <AttachmentInfos>
      <Label>
        <Barcodes>
          <Barcode>
            <Content>BARCODE-PHI</Content>
          </Barcode>
        </Barcodes>
      </Label>
    </AttachmentInfos>
  </Metadata>
</ImageDocument>
"""


class _FakeTileSource:
    def __init__(self, metadata, path=None, name='openslide'):
        self._metadata = metadata
        self._path = path
        self.name = name

    def getInternalMetadata(self):
        return self._metadata

    def _getLargeImagePath(self):
        return self._path


def test_apply_czi_redact_list_scrubs_document_and_barcode():
    redact = {
        'czi;Document.Title': generate_system_redaction_list_entry('deid-title'),
        'czi;Document.Name': generate_system_redaction_list_entry('deid-title'),
        'czi;Document.UserName': {'value': None, 'automatic': True},
        'czi;Document.Description': {'value': None, 'automatic': True},
        'czi;Document.Comment': {'value': None, 'automatic': True},
        'czi;Document.Keywords': {'value': None, 'automatic': True},
        'czi;Barcode.Content': generate_system_redaction_list_entry('deid-title'),
    }
    scrubbed, prior, after = apply_czi_redact_list_to_xml(SAMPLE_XML, redact)

    assert prior['czi;Document.UserName'] == 'jdoe'
    assert prior['czi;Barcode.Content'] == 'BARCODE-PHI'
    assert after['czi;Document.Title'] == 'deid-title'
    assert after['czi;Document.Name'] == 'deid-title'
    assert after['czi;Document.UserName'] == ''
    assert after['czi;Barcode.Content'] == 'deid-title'
    assert 'jdoe' not in scrubbed
    assert 'BARCODE-PHI' not in scrubbed
    assert 'deid-title' in scrubbed


def test_sanitize_czi_metadata_clears_phi_keeps_mechanics():
    scrubbed, prior, after = sanitize_czi_metadata_xml(SAMPLE_XML, 'deid-title')

    assert prior['czi;Document.UserName'] == 'jdoe'
    assert after['czi;Document.UserName'] == ''
    assert after['czi;Document.Title'] == 'deid-title'
    assert after['czi;Barcode.Content'] == 'deid-title'
    assert 'jdoe' not in scrubbed
    assert 'MRN-999' not in scrubbed
    assert 'Alice' not in scrubbed
    assert 'leak' not in scrubbed
    assert 'BARCODE-PHI' not in scrubbed
    assert '<Scaling>' in scrubbed
    assert '2.5e-07' in scrubbed
    assert '<Dimensions>' in scrubbed
    assert 'Gray8' in scrubbed
    assert 'czi;Document.UserName' in prior
    assert prior.get('czi;Patient.Id') == 'MRN-999' or any(
        'Patient' in k and prior[k] == 'MRN-999' for k in prior
    )


def test_sanitize_removes_autosave_and_coarsens_dates():
    scrubbed, prior, after = sanitize_czi_metadata_xml(SAMPLE_XML, 'deid-title')

    assert '<AutoSave>' not in scrubbed
    assert 'Sharma Lab' not in scrubbed
    assert 'SingleFileSaveDestinationFolder' not in scrubbed
    assert 'StorageFolder' not in scrubbed
    assert any('AutoSave' in k or 'ImageName' in k for k in prior)

    assert prior['czi;AcquisitionDateAndTime'] == '2022-10-05T15:06:46.278368Z'
    assert after['czi;AcquisitionDateAndTime'] == '2022-01-01T00:00:00Z'
    assert '2022-10-05T15:06:46' not in scrubbed
    assert '2022-01-01T00:00:00Z' in scrubbed

    assert prior['czi;CreationDate'] == '2022-10-05T12:00:00Z'
    assert after['czi;CreationDate'] == '2022-01-01T00:00:00Z'

    assert '<SizeX>100</SizeX>' in scrubbed
    assert '<Scaling>' in scrubbed
    assert 'Gray8' in scrubbed


def test_year_coarsen_clears_unparseable_timestamp():
    from src.python.DeidTools.czi_metadata import _year_coarsen_iso_datetime

    assert _year_coarsen_iso_datetime('2022-10-05T15:06:46.278368Z') == (
        '2022-01-01T00:00:00Z'
    )
    assert _year_coarsen_iso_datetime('not-a-date') is None

    xml = (
        '<ImageDocument><Metadata><Information><Image>'
        '<AcquisitionDateAndTime>garbage</AcquisitionDateAndTime>'
        '</Image></Information></Metadata></ImageDocument>'
    )
    scrubbed, prior, after = sanitize_czi_metadata_xml(xml, 't')
    assert prior['czi;AcquisitionDateAndTime'] == 'garbage'
    assert after['czi;AcquisitionDateAndTime'] == ''
    assert '<AcquisitionDateAndTime></AcquisitionDateAndTime>' in scrubbed or (
        '<AcquisitionDateAndTime/>' in scrubbed
    )


def test_flatten_fake_ifds_includes_name():
    prior = {'czi;Document.Title': 'Old'}
    after = {'czi;Document.Title': 'New'}
    prior_ifds, new_ifds = flatten_czi_fields_to_fake_ifds(prior, after)
    assert len(prior_ifds) == 1
    tag = prior_ifds[0]['tags'][0]
    assert tag['name'] == 'czi;Document.Title'
    assert tag['data'] == 'Old'
    assert new_ifds[0]['tags'][0]['data'] == 'New'


def test_pretty_print_czi_xml_indents_document():
    pretty = pretty_print_czi_xml(
        '<ImageDocument><Metadata><Document><Title>Old</Title>'
        '</Document></Metadata></ImageDocument>'
    )
    assert '\n  <Metadata>' in pretty
    assert '<Title>Old</Title>' in pretty


def test_get_standard_redactions_format_czi_replaces_images():
    redact = get_standard_redactions_format_czi(None, None, None, 'out-name')
    assert 'label' in redact['images']
    assert 'macro' in redact['images']
    assert redact['images']['macro'].get('square') is True
    assert 'czi;Document.Title' in redact['metadata']
    assert redact['metadata']['czi;Document.Title']['value'] == 'out-name'


def test_determine_format_czi_by_path():
    ts = _FakeTileSource({}, path='/data/slide.czi')
    assert determine_format(ts) == 'czi'


def test_determine_format_czi_by_openslide_vendor():
    ts = _FakeTileSource(
        {'openslide': {'openslide.vendor': 'zeiss'}},
        path='/data/slide.unknown',
    )
    assert determine_format(ts) == 'czi'


def test_deidtools_determine_format_czi_path():
    tools = DeidTools()
    ts = _FakeTileSource({}, path='/tmp/a.czi')
    assert tools.determine_format(ts) == 'czi'

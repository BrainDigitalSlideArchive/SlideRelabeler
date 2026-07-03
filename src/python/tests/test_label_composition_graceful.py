import os
import sys
import uuid

print("In module products sys.path[0], __package__ ==", sys.path[0], __package__)

from src.python.DeidTools import DeidTools


def _base_output_dict(**label_overrides):
    return {
        'config': {
            'label': {
                'qr_mode': {'value': 'uuid'},
                'add_text': False,
                'add_icon': True,
                'add_qr': True,
                'icon_file': None,
                **label_overrides,
            },
        },
        '__reserved': {
            'uuid': str(uuid.uuid4()),
        },
    }


def test_add_icon_without_file_is_noop():
    deid_tools = DeidTools()
    output_dict = _base_output_dict(add_icon=True, add_qr=False, icon_file=None)

    image, height = deid_tools.add_icon_to_image(None, output_dict, 0)

    assert image is not None
    assert height == 0


def test_add_qr_with_empty_payload_is_noop():
    deid_tools = DeidTools()
    output_dict = _base_output_dict(
        add_icon=False,
        add_qr=True,
        qr_mode={'value': 'none'},
    )

    image, height = deid_tools.add_qr_code_to_image(None, output_dict, 'layout-test', 0)

    assert image is not None
    assert height == 0


def test_add_icon_and_qr_row_icon_only_when_qr_missing():
    deid_tools = DeidTools()
    icon_file_path = os.path.join(".", "src", "assets", "BDSA_clear.png")
    output_dict = _base_output_dict(
        icon_file={'source': {'path': str(icon_file_path)}},
        qr_mode={'value': 'none'},
    )

    combined_image, combined_height = deid_tools.add_icon_and_qr_row(
        None, output_dict, 'layout-test', 0,
    )
    icon_image, icon_height = deid_tools.add_icon_to_image(None, output_dict, 0)

    assert combined_image is not None
    assert combined_height == icon_height
    assert combined_height > 0


def test_add_icon_and_qr_row_qr_only_when_icon_missing():
    deid_tools = DeidTools()
    output_dict = _base_output_dict(icon_file=None)

    combined_image, combined_height = deid_tools.add_icon_and_qr_row(
        None, output_dict, 'layout-test', 0,
    )
    qr_image, qr_height = deid_tools.add_qr_code_to_image(None, output_dict, 'layout-test', 0)

    assert combined_image is not None
    assert combined_height == qr_height
    assert combined_height > 0


def test_add_icon_and_qr_row_noop_when_both_missing():
    deid_tools = DeidTools()
    output_dict = _base_output_dict(
        icon_file=None,
        qr_mode={'value': 'none'},
    )

    image, height = deid_tools.add_icon_and_qr_row(None, output_dict, 'layout-test', 0)

    assert image is not None
    assert height == 0


def test_get_deid_label_compose_only_without_path():
    deid_tools = DeidTools()
    output_dict = {
        'config': {
            'filename': {'source': 'uuid'},
            'label': {
                'add_text': True,
                'add_qr': True,
                'add_icon': False,
            },
        },
        '__configPreview': {'composeOnly': True},
        '__reserved': {
            'uuid': 'test-uuid',
            'rename': 'test-uuid',
            'source': {'path': '', 'filename': 'preview.tiff'},
            'labelText': 'Preview Label',
            'qrPayload': 'qr-data-here',
        },
    }

    label = deid_tools.get_deid_label(output_dict)

    assert label is not None
    assert label.size[0] > 50
    assert label.size[1] > 50


def test_should_compose_label_only_when_path_missing():
    deid_tools = DeidTools()
    assert deid_tools._should_compose_label_only({
        '__configPreview': {'composeOnly': True},
        '__reserved': {'source': {'path': '/tmp/real.tiff'}},
    })
    assert deid_tools._should_compose_label_only({
        '__reserved': {'source': {'path': ''}},
    })
    assert deid_tools._should_compose_label_only({
        '__reserved': {'source': {'path': '/nonexistent/path.tiff'}},
    })
    assert not deid_tools._should_compose_label_only({
        '__reserved': {'source': {'path': __file__}},
    })


if __name__ == "__main__":
    test_add_icon_without_file_is_noop()
    test_add_qr_with_empty_payload_is_noop()
    test_add_icon_and_qr_row_icon_only_when_qr_missing()
    test_add_icon_and_qr_row_qr_only_when_icon_missing()
    test_add_icon_and_qr_row_noop_when_both_missing()
    test_get_deid_label_compose_only_without_path()
    test_should_compose_label_only_when_path_missing()
    print("test_label_composition_graceful passed")

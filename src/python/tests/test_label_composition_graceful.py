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
    assert label.size[0] == 750
    assert label.size[1] > 50


def test_get_deid_label_text_icon_qr_fixed_width():
    deid_tools = DeidTools()
    icon_file_path = os.path.join(".", "src", "assets", "BDSA_clear.png")
    label_width = 600
    output_dict = {
        'config': {
            'filename': {'source': 'uuid'},
            'label': {
                'add_text': True,
                'add_qr': True,
                'add_icon': True,
                'labelWidth': label_width,
                'customizeLabelWidth': True,
                'icon_file': {'source': {'path': str(icon_file_path)}},
                'fontSizeMode': 'manual',
                'fontSize': 0.1,
            },
        },
        '__configPreview': {'composeOnly': True},
        '__reserved': {
            'uuid': 'test-uuid',
            'rename': 'test-uuid',
            'source': {'path': '', 'filename': 'preview.tiff'},
            'labelText': 'Preview\nLabel',
            'qrPayload': 'qr-data-here',
        },
    }

    label = deid_tools.get_deid_label(output_dict)
    assert label is not None
    assert label.size[0] == label_width
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


def test_add_text_to_image_multiline_taller_than_single_line():
    deid_tools = DeidTools()
    single, single_h = deid_tools.add_text_to_image(
        None, 'SingleLineLabel', False, label_config={'fontSizeMode': 'manual', 'fontSize': 0.12},
    )
    multi, multi_h = deid_tools.add_text_to_image(
        None, 'LineOne\nLineTwo', False, label_config={'fontSizeMode': 'manual', 'fontSize': 0.12},
    )
    assert single is not None and multi is not None
    assert multi_h > single_h


def test_add_text_to_image_manual_font_larger_than_small():
    deid_tools = DeidTools()
    small, _ = deid_tools.add_text_to_image(
        None, 'ABC', False, label_config={'fontSizeMode': 'manual', 'fontSize': 0.05},
    )
    large, _ = deid_tools.add_text_to_image(
        None, 'ABC', False, label_config={'fontSizeMode': 'manual', 'fontSize': 0.25},
    )
    # Larger font grows the title band when square layout is forced by blank canvas.
    assert large.size[1] >= small.size[1]


def test_get_deid_label_skips_qr_for_multiline_label_text_mode():
    deid_tools = DeidTools()
    reserved = {
        'uuid': 'test-uuid',
        'rename': 'test-uuid',
        'source': {'path': '', 'filename': 'preview.tiff'},
        'labelText': 'LineA\nLineB',
        'qrPayload': 'LineA\nLineB',
    }
    label_cfg = {
        'add_text': True,
        'add_icon': False,
        'qrContent': {'mode': 'label_text'},
        'qrDefault': 'label_text',
        'fontSizeMode': 'manual',
        'fontSize': 0.1,
    }

    with_qr_flag = deid_tools.get_deid_label({
        'config': {
            'filename': {'source': 'uuid'},
            'label': {**label_cfg, 'add_qr': True},
        },
        '__configPreview': {'composeOnly': True},
        '__reserved': reserved,
    })
    text_only = deid_tools.get_deid_label({
        'config': {
            'filename': {'source': 'uuid'},
            'label': {**label_cfg, 'add_qr': False},
        },
        '__configPreview': {'composeOnly': True},
        '__reserved': reserved,
    })

    assert with_qr_flag is not None and text_only is not None
    assert with_qr_flag.size == text_only.size


if __name__ == "__main__":
    test_add_icon_without_file_is_noop()
    test_add_qr_with_empty_payload_is_noop()
    test_add_icon_and_qr_row_icon_only_when_qr_missing()
    test_add_icon_and_qr_row_qr_only_when_icon_missing()
    test_add_icon_and_qr_row_noop_when_both_missing()
    test_get_deid_label_compose_only_without_path()
    test_get_deid_label_text_icon_qr_fixed_width()
    test_should_compose_label_only_when_path_missing()
    test_add_text_to_image_multiline_taller_than_single_line()
    test_add_text_to_image_manual_font_larger_than_small()
    test_get_deid_label_skips_qr_for_multiline_label_text_mode()
    print("test_label_composition_graceful passed")

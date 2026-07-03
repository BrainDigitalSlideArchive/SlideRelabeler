import os
import sys
import uuid

print("In module products sys.path[0], __package__ ==", sys.path[0], __package__)

from src.python.DeidTools import DeidTools


def test_icon_qr_side_by_side_layout():
    deid_tools = DeidTools()
    icon_file_path = os.path.join(".", "src", "assets", "BDSA_clear.png")

    output_dict = {
        'config': {
            'label': {
                'qr_mode': {'value': 'uuid'},
                'add_text': False,
                'add_icon': True,
                'add_qr': True,
                'icon_file': {'source': {'path': str(icon_file_path)}},
            },
        },
        '__reserved': {
            'uuid': str(uuid.uuid4()),
        },
    }

    combined_image, combined_height = deid_tools.add_icon_and_qr_row(
        None, output_dict, 'layout-test', 0,
    )
    icon_image, icon_height = deid_tools.add_icon_to_image(None, output_dict, 0)
    qr_image, qr_height = deid_tools.add_qr_code_to_image(None, output_dict, 'layout-test', 0)

    assert combined_image is not None
    assert combined_height > 0
    assert combined_height < icon_height + qr_height, (
        "Side-by-side row should be shorter than stacked icon + QR bands"
    )

    row_top = deid_tools.sep_height
    row_bottom = combined_height - deid_tools.sep_height
    mid_x = combined_image.size[0] // 2

    has_left = False
    has_right = False
    for y in range(row_top, row_bottom):
        for x in range(combined_image.size[0]):
            if combined_image.getpixel((x, y)) == (255, 255, 255):
                continue
            if x < mid_x:
                has_left = True
            else:
                has_right = True

    assert has_left, "Expected icon content in the left half"
    assert has_right, "Expected QR content in the right half"


if __name__ == "__main__":
    test_icon_qr_side_by_side_layout()
    print("test_icon_qr_side_by_side_layout passed")

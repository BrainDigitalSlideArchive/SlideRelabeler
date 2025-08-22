from src.python.DeidTools import DeidTools
from src.python.tests.common_output_dict import output_dict

deid_tools = DeidTools()
output = deid_tools.perform_deid(output_dict)
print(output)
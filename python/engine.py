import sys

print(f'Python code is running at {sys.argv[0]}')

name = ''.join(sys.argv[1:])

print(f'Hi {name}, hello from python!')

sys.stdout.flush()
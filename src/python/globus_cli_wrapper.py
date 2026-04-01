# Wrapper script for globus-cli to use as PyInstaller entry point
# This allows us to bundle globus-cli as a standalone executable

import sys
from globus_cli import main

if __name__ == '__main__':
    sys.exit(main())

import pkgutil                          # Used to discover all modules inside a folder (package)
import importlib                        # Used to dynamically import modules by name (string)
from . import admins as admin_package   # Import the 'admins' FOLDER WHERE  all the admin.py is

# Loop through every module found inside the admins/ directory
for _, module_name, _ in pkgutil.iter_modules(admin_package.__path__):
    # Dynamically import each module so Django can register admin classes
    importlib.import_module(
        f"{admin_package.__name__}.{module_name}"
    )

#!/usr/bin/env python3
"""
MCP Server Configuration Validator

Validates MCP server configuration files for common issues:
- JSON syntax errors
- Missing required fields
- Invalid file paths
- Executable accessibility
- Environment variable references
"""

import json
import sys
import os
from pathlib import Path
from typing import Dict, List, Tuple

class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_success(message: str):
    print(f"{Colors.GREEN}✅ {message}{Colors.RESET}")

def print_warning(message: str):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.RESET}")

def print_error(message: str):
    print(f"{Colors.RED}❌ {message}{Colors.RESET}")

def print_info(message: str):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.RESET}")

def validate_json_syntax(config_path: Path) -> Tuple[bool, Dict]:
    """Validate JSON syntax and parse config"""
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        print_success(f"Valid JSON syntax in {config_path.name}")
        return True, config
    except json.JSONDecodeError as e:
        print_error(f"JSON syntax error: {e}")
        return False, {}
    except FileNotFoundError:
        print_error(f"Configuration file not found: {config_path}")
        return False, {}
    except Exception as e:
        print_error(f"Error reading config: {e}")
        return False, {}

def validate_server_structure(server_name: str, server_config: Dict) -> List[str]:
    """Validate individual server configuration structure"""
    issues = []

    # Check required fields
    if 'command' not in server_config:
        issues.append(f"Missing 'command' field")

    # Check command is not empty
    if server_config.get('command') == '':
        issues.append(f"'command' field is empty")

    # Args should be a list if present
    if 'args' in server_config and not isinstance(server_config['args'], list):
        issues.append(f"'args' should be a list, got {type(server_config['args']).__name__}")

    # Env should be a dict if present
    if 'env' in server_config and not isinstance(server_config['env'], dict):
        issues.append(f"'env' should be an object, got {type(server_config['env']).__name__}")

    # CWD should be a string if present
    if 'cwd' in server_config and not isinstance(server_config['cwd'], str):
        issues.append(f"'cwd' should be a string, got {type(server_config['cwd']).__name__}")

    return issues

def check_executable_exists(command: str) -> bool:
    """Check if command/executable exists in PATH or as absolute path"""
    # Check if absolute path
    if command.startswith('/'):
        return os.path.isfile(command) and os.access(command, os.X_OK)

    # Check in PATH
    import shutil
    return shutil.which(command) is not None

def check_file_exists(file_path: str, base_dir: str = None) -> bool:
    """Check if file exists, considering base directory"""
    if file_path.startswith('/'):
        # Absolute path
        return os.path.isfile(file_path)
    elif base_dir:
        # Relative to base directory
        full_path = os.path.join(base_dir, file_path)
        return os.path.isfile(full_path)
    else:
        return os.path.isfile(file_path)

def validate_server_files(server_name: str, server_config: Dict) -> List[str]:
    """Validate file paths and executables exist"""
    warnings = []

    command = server_config.get('command', '')

    # Check command executable
    if command and not check_executable_exists(command):
        warnings.append(f"Command executable not found: {command}")

    # Check working directory if specified
    cwd = server_config.get('cwd')
    if cwd and not os.path.isdir(cwd):
        warnings.append(f"Working directory not found: {cwd}")

    # Check script files in args
    args = server_config.get('args', [])
    base_dir = cwd if cwd else None

    for arg in args:
        # Skip flags and npx package names
        if arg.startswith('-') or arg.startswith('@'):
            continue

        # Check if it looks like a file path
        if '/' in arg or arg.endswith('.js') or arg.endswith('.py'):
            if not check_file_exists(arg, base_dir):
                warnings.append(f"Script file not found: {arg}")

    return warnings

def check_environment_variables(server_name: str, server_config: Dict) -> List[str]:
    """Check environment variable references"""
    info = []

    env_vars = server_config.get('env', {})

    for key, value in env_vars.items():
        # Check for shell variable substitution syntax
        if isinstance(value, str) and value.startswith('${') and value.endswith('}'):
            var_name = value[2:-1]
            if var_name not in os.environ:
                info.append(f"Environment variable ${{{var_name}}} not set in current environment")
            else:
                print_success(f"  Environment variable ${{{var_name}}} is set")
        elif isinstance(value, str) and not value:
            info.append(f"Environment variable {key} is set but empty")

    return info

def validate_mcp_config(config_path: Path) -> bool:
    """Main validation function"""
    print(f"\n{Colors.BOLD}MCP Configuration Validator{Colors.RESET}")
    print(f"Validating: {config_path}\n")

    # Validate JSON syntax
    valid, config = validate_json_syntax(config_path)
    if not valid:
        return False

    # Check for mcpServers key
    if 'mcpServers' not in config:
        print_error("Configuration missing 'mcpServers' key")
        return False

    servers = config['mcpServers']

    if not servers:
        print_warning("No MCP servers configured")
        return True

    print_info(f"Found {len(servers)} server(s) configured\n")

    all_valid = True

    # Validate each server
    for server_name, server_config in servers.items():
        print(f"\n{Colors.BOLD}Server: {server_name}{Colors.RESET}")

        # Validate structure
        structure_issues = validate_server_structure(server_name, server_config)
        if structure_issues:
            all_valid = False
            for issue in structure_issues:
                print_error(f"  {issue}")
        else:
            print_success("  Structure valid")

        # Validate files
        file_warnings = validate_server_files(server_name, server_config)
        for warning in file_warnings:
            print_warning(f"  {warning}")

        # Check environment variables
        env_info = check_environment_variables(server_name, server_config)
        for info in env_info:
            print_info(f"  {info}")

        # Print configuration summary
        print(f"  Command: {server_config.get('command', 'N/A')}")
        if 'args' in server_config:
            print(f"  Args: {' '.join(server_config['args'])}")
        if 'cwd' in server_config:
            print(f"  Working Directory: {server_config['cwd']}")
        if 'env' in server_config:
            print(f"  Environment Variables: {', '.join(server_config['env'].keys())}")

    print("\n" + "="*60)
    if all_valid and not any([file_warnings for _ in servers]):
        print_success("Configuration validation passed!")
    elif all_valid:
        print_warning("Configuration valid with warnings")
    else:
        print_error("Configuration has errors that need to be fixed")
    print("="*60 + "\n")

    return all_valid

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 validate_mcp.py <config-file>")
        print("\nCommon config locations:")
        print("  macOS: ~/Library/Application Support/Claude/claude_desktop_config.json")
        print("  Custom: Specify path to your config file")
        sys.exit(1)

    config_path = Path(sys.argv[1]).expanduser()

    # If just a filename, try common locations
    if not config_path.is_absolute():
        common_locations = [
            Path.home() / "Library/Application Support/Claude/claude_desktop_config.json",
            Path.home() / ".config/claude/config.json",
            Path.cwd() / config_path,
        ]

        for location in common_locations:
            if location.exists():
                config_path = location
                break

    valid = validate_mcp_config(config_path)
    sys.exit(0 if valid else 1)

if __name__ == '__main__':
    main()

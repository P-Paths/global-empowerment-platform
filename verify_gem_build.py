#!/usr/bin/env python3
"""
GEM Platform Build Verification Script
Automatically verifies all components of the GEM Platform build.
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, List, Set, Tuple
import re

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'

class GEMVerifier:
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root)
        self.backend_path = self.project_root / "backend"
        self.frontend_path = self.project_root / "frontend"
        self.results = {
            "database_tables": {"found": [], "missing": []},
            "models": {"found": [], "missing": []},
            "routers": {"found": [], "missing": []},
            "services": {"found": [], "missing": []},
            "frontend_pages": {"found": [], "missing": []},
            "frontend_hooks": {"found": [], "missing": []},
            "errors": []
        }
        
        # Expected components
        self.expected_tables = {
            "profiles", "posts", "comments", "followers", "messages",
            "tasks", "funding_score_logs", "persona_clones", "pitchdecks"
        }
        
        self.expected_models = {
            "Profile", "Post", "Comment", "Follower", "Message",
            "Task", "FundingScoreLog", "PersonaClone", "PitchDeck"
        }
        
        self.expected_routers = {
            "profiles", "posts", "comments", "followers", "messages",
            "tasks", "score", "clone", "pitchdeck"
        }
        
        self.expected_pages = {
            "feed", "profile", "tasks", "funding-score",
            "clone-studio", "pitchdeck", "messages"
        }
        
        self.expected_hooks = {
            "useProfile", "usePosts", "useCreatePost", "useLikePost",
            "useComments", "useCreateComment", "useFollow", "useUnfollow",
            "useMessages", "useSendMessage", "useTasks", "useCompleteTask",
            "useFundingScore", "usePersonaClones", "useCreatePersonaClone",
            "usePitchDeck", "useCreatePitchDeck"
        }

    def print_header(self, text: str):
        print(f"\n{BOLD}{BLUE}{'='*60}{RESET}")
        print(f"{BOLD}{BLUE}{text.center(60)}{RESET}")
        print(f"{BOLD}{BLUE}{'='*60}{RESET}\n")

    def print_success(self, text: str):
        print(f"{GREEN}✅ {text}{RESET}")

    def print_error(self, text: str):
        print(f"{RED}❌ {text}{RESET}")

    def print_warning(self, text: str):
        print(f"{YELLOW}⚠️  {text}{RESET}")

    def verify_database_tables(self):
        """Verify SQL migration files and tables"""
        self.print_header("STEP 1: Database Tables Verification")
        
        migrations_path = self.backend_path / "database_migrations"
        if not migrations_path.exists():
            self.print_error("Database migrations directory not found!")
            return
        
        migration_files = list(migrations_path.glob("*.sql"))
        if not migration_files:
            self.print_error("No SQL migration files found!")
            return
        
        found_tables = set()
        
        for migration_file in migration_files:
            if migration_file.name == "verify_tables.sql":
                continue
                
            self.print_success(f"Found migration: {migration_file.name}")
            
            content = migration_file.read_text()
            
            # Extract table names from CREATE TABLE statements
            table_pattern = r'CREATE TABLE (?:IF NOT EXISTS )?([a-z_]+)'
            tables = re.findall(table_pattern, content, re.IGNORECASE)
            
            for table in tables:
                found_tables.add(table)
                self.print_success(f"  └─ Table: {table}")
        
        # Check for expected tables
        missing = self.expected_tables - found_tables
        if missing:
            self.print_warning(f"Missing expected tables: {', '.join(missing)}")
        else:
            self.print_success("All expected GEM tables found!")
        
        self.results["database_tables"]["found"] = list(found_tables)
        self.results["database_tables"]["missing"] = list(missing)

    def verify_models(self):
        """Verify SQLAlchemy models"""
        self.print_header("STEP 2: SQLAlchemy Models Verification")
        
        models_path = self.backend_path / "app" / "models"
        if not models_path.exists():
            self.print_error("Models directory not found!")
            return
        
        model_files = list(models_path.glob("*.py"))
        if not model_files:
            self.print_error("No model files found!")
            return
        
        found_models = set()
        
        for model_file in model_files:
            if model_file.name == "__init__.py":
                continue
            
            self.print_success(f"Found model file: {model_file.name}")
            
            content = model_file.read_text()
            
            # Extract class definitions
            class_pattern = r'class (\w+)\(.*?Base.*?\):'
            classes = re.findall(class_pattern, content)
            
            for cls in classes:
                found_models.add(cls)
                self.print_success(f"  └─ Model: {cls}")
        
        # Check for expected models
        missing = self.expected_models - found_models
        if missing:
            self.print_warning(f"Missing expected models: {', '.join(missing)}")
        else:
            self.print_success("All expected GEM models found!")
        
        self.results["models"]["found"] = list(found_models)
        self.results["models"]["missing"] = list(missing)

    def verify_routers(self):
        """Verify FastAPI routers"""
        self.print_header("STEP 3: FastAPI Routers Verification")
        
        api_path = self.backend_path / "app" / "api" / "v1"
        if not api_path.exists():
            self.print_error("API v1 directory not found!")
            return
        
        router_files = list(api_path.glob("*.py"))
        if not router_files:
            self.print_error("No router files found!")
            return
        
        found_routers = set()
        
        for router_file in router_files:
            if router_file.name == "__init__.py":
                continue
            
            router_name = router_file.stem
            found_routers.add(router_name)
            self.print_success(f"Found router: {router_name}.py")
            
            # Try to extract route definitions
            content = router_file.read_text()
            route_pattern = r'@router\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']'
            routes = re.findall(route_pattern, content)
            
            for method, path in routes:
                print(f"  └─ {method.upper()} {path}")
        
        # Check for expected routers
        missing = self.expected_routers - found_routers
        if missing:
            self.print_warning(f"Missing expected routers: {', '.join(missing)}")
        else:
            self.print_success("All expected routers found!")
        
        self.results["routers"]["found"] = list(found_routers)
        self.results["routers"]["missing"] = list(missing)

    def verify_services(self):
        """Verify service files"""
        self.print_header("STEP 4: Service Layer Verification")
        
        services_path = self.backend_path / "app" / "services"
        if not services_path.exists():
            self.print_error("Services directory not found!")
            return
        
        service_files = list(services_path.glob("*.py"))
        if not service_files:
            self.print_error("No service files found!")
            return
        
        found_services = []
        
        for service_file in service_files:
            if service_file.name == "__init__.py":
                continue
            
            service_name = service_file.stem
            found_services.append(service_name)
            self.print_success(f"Found service: {service_name}.py")
            
            # Try to extract function definitions
            content = service_file.read_text()
            func_pattern = r'def (\w+)\([^)]*\):'
            functions = re.findall(func_pattern, content)
            
            for func in functions[:5]:  # Show first 5 functions
                if not func.startswith("_"):
                    print(f"  └─ {func}()")
        
        self.results["services"]["found"] = found_services

    def verify_frontend_pages(self):
        """Verify Next.js pages"""
        self.print_header("STEP 5: Frontend Pages Verification")
        
        app_path = self.frontend_path / "src" / "app"
        if not app_path.exists():
            self.print_error("Frontend app directory not found!")
            return
        
        found_pages = set()
        
        # Check for expected pages
        for page_name in self.expected_pages:
            if page_name == "profile":
                page_path = app_path / "profile" / "[id]" / "page.tsx"
            else:
                page_path = app_path / page_name / "page.tsx"
            
            if page_path.exists():
                found_pages.add(page_name)
                self.print_success(f"Found page: /{page_name}")
            else:
                self.print_warning(f"Missing page: /{page_name}")
        
        missing = self.expected_pages - found_pages
        if missing:
            self.print_warning(f"Missing expected pages: {', '.join(missing)}")
        else:
            self.print_success("All expected pages found!")
        
        self.results["frontend_pages"]["found"] = list(found_pages)
        self.results["frontend_pages"]["missing"] = list(missing)

    def verify_frontend_hooks(self):
        """Verify React hooks"""
        self.print_header("STEP 6: Frontend Hooks Verification")
        
        hooks_path = self.frontend_path / "src" / "hooks"
        if not hooks_path.exists():
            self.print_error("Hooks directory not found!")
            return
        
        hook_files = list(hooks_path.glob("*.ts"))
        hook_files.extend(hooks_path.glob("*.tsx"))
        
        if not hook_files:
            self.print_error("No hook files found!")
            return
        
        found_hooks = set()
        
        for hook_file in hook_files:
            self.print_success(f"Found hook file: {hook_file.name}")
            
            content = hook_file.read_text()
            
            # Extract hook function definitions
            hook_pattern = r'export (?:function )?(\w+)\([^)]*\)'
            hooks = re.findall(hook_pattern, content)
            
            for hook in hooks:
                if hook.startswith("use"):
                    found_hooks.add(hook)
                    self.print_success(f"  └─ Hook: {hook}")
        
        # Check for expected hooks
        missing = self.expected_hooks - found_hooks
        if missing:
            self.print_warning(f"Missing expected hooks: {', '.join(missing)}")
        else:
            self.print_success("All expected hooks found!")
        
        self.results["frontend_hooks"]["found"] = list(found_hooks)
        self.results["frontend_hooks"]["missing"] = list(missing)

    def generate_report(self):
        """Generate final verification report"""
        self.print_header("VERIFICATION SUMMARY")
        
        total_checks = 0
        passed_checks = 0
        
        # Database tables
        total_checks += len(self.expected_tables)
        passed_checks += len(set(self.results["database_tables"]["found"]) & self.expected_tables)
        
        # Models
        total_checks += len(self.expected_models)
        passed_checks += len(set(self.results["models"]["found"]) & self.expected_models)
        
        # Routers
        total_checks += len(self.expected_routers)
        passed_checks += len(set(self.results["routers"]["found"]) & self.expected_routers)
        
        # Pages
        total_checks += len(self.expected_pages)
        passed_checks += len(set(self.results["frontend_pages"]["found"]) & self.expected_pages)
        
        # Hooks
        total_checks += len(self.expected_hooks)
        passed_checks += len(set(self.results["frontend_hooks"]["found"]) & self.expected_hooks)
        
        percentage = (passed_checks / total_checks * 100) if total_checks > 0 else 0
        
        print(f"\n{BOLD}Overall Verification Score: {passed_checks}/{total_checks} ({percentage:.1f}%){RESET}\n")
        
        if percentage >= 90:
            self.print_success("🎉 Build is ready for deployment!")
        elif percentage >= 70:
            self.print_warning("⚠️  Build is mostly complete but has some gaps.")
        else:
            self.print_error("❌ Build is incomplete. Review missing components.")
        
        # Save results to JSON
        report_path = self.project_root / "GEM_VERIFICATION_REPORT.json"
        with open(report_path, "w") as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n{BOLD}Detailed report saved to: {report_path}{RESET}\n")

    def run_all_checks(self):
        """Run all verification checks"""
        print(f"{BOLD}{BLUE}")
        print("="*60)
        print("GEM Platform Build Verification".center(60))
        print("="*60)
        print(f"{RESET}\n")
        
        try:
            self.verify_database_tables()
            self.verify_models()
            self.verify_routers()
            self.verify_services()
            self.verify_frontend_pages()
            self.verify_frontend_hooks()
            self.generate_report()
        except Exception as e:
            self.print_error(f"Verification failed with error: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

if __name__ == "__main__":
    verifier = GEMVerifier()
    verifier.run_all_checks()


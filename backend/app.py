import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from models import db
from auth_middleware import enforce_auth
from routes.auth import auth_bp
from routes.projects import projects_bp
from routes.reports import reports_bp
from routes.profile import profile_bp
from routes.comparisons import comparisons_bp
from routes.approvals import approvals_bp
from routes.ai_matching import ai_matching_bp
from routes.watson_agents import watson_bp
from routes.enhanced_ai_matching import enhanced_ai_bp


# Env keys that must be set when FLASK_ENV=production. Anything missing
# triggers a hard fail at boot rather than letting a misconfigured prod
# instance limp along with insecure defaults.
_PROD_REQUIRED_ENV = (
	"SECRET_KEY",
	"DATABASE_URL",
	"CORS_ORIGIN",
	# Required so prod never silently falls back to the mock-rationale path
	# in ai_models/ai_model.py. The marquee feature must work in prod.
	"OPENROUTER_API_KEY",
)


def _is_production() -> bool:
	return os.environ.get("FLASK_ENV", "").lower() == "production"


def _validate_prod_env() -> None:
	if not _is_production():
		return
	missing = [k for k in _PROD_REQUIRED_ENV if not os.environ.get(k)]
	if missing:
		raise RuntimeError(
			f"Missing required environment variables in production: {missing}. "
			"Refusing to boot to avoid running with insecure defaults."
		)
	if os.environ.get("CORS_ORIGIN") in (None, "", "*"):
		raise RuntimeError(
			"CORS_ORIGIN must be an explicit origin in production (not '*' or empty)."
		)


def create_app() -> Flask:
	load_dotenv()
	_validate_prod_env()

	app = Flask(__name__, template_folder='templates')

	secret = os.environ.get("SECRET_KEY")
	if not secret:
		if _is_production():
			raise RuntimeError("SECRET_KEY is required in production")
		secret = "dev-secret-do-not-use-in-prod"
	app.config["SECRET_KEY"] = secret

	if os.environ.get("DATABASE_URL"):
		app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["DATABASE_URL"]
	else:
		if _is_production():
			raise RuntimeError("DATABASE_URL is required in production")
		base_dir = os.path.abspath(os.path.dirname(__file__))
		sqlite_path = os.path.join(base_dir, "sustainalign.db")
		app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{sqlite_path}"
	app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

	cors_origin = os.environ.get("CORS_ORIGIN")
	if not cors_origin:
		if _is_production():
			raise RuntimeError("CORS_ORIGIN must be set in production")
		cors_origin = "http://localhost:5173"
	CORS(app, resources={r"/api/*": {"origins": cors_origin}})

	# Init DB
	db.init_app(app)
	with app.app_context():
		db.create_all()

	# Global auth gate. Allows /api/auth/* and /api/health through; every
	# other /api/* request must present a valid JWT. Per-route role checks
	# are layered on top via @require_role decorators.
	app.before_request(enforce_auth())

	# Blueprints (API)
	app.register_blueprint(auth_bp, url_prefix="/api/auth")
	app.register_blueprint(profile_bp, url_prefix="/api/profile")
	app.register_blueprint(projects_bp, url_prefix="/api/projects")
	app.register_blueprint(reports_bp, url_prefix="/api/reports")
	app.register_blueprint(comparisons_bp, url_prefix="/api/comparisons")
	app.register_blueprint(approvals_bp, url_prefix="/api/approvals")
	app.register_blueprint(ai_matching_bp)
	app.register_blueprint(watson_bp)
	app.register_blueprint(enhanced_ai_bp)

	# View pages
	from routes.views import views_bp
	app.register_blueprint(views_bp)

	@app.route("/api/health")
	def health():
		return jsonify({"status": "ok"}), 200

	return app


if __name__ == "__main__":
	app = create_app()
	debug = os.environ.get("FLASK_ENV", "").lower() == "development"
	app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=debug)



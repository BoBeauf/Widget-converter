// RSD → EUR | Widget Scriptable
// ─────────────────────────────────────────────────────
// Installation :
//   1. Installer l'app "Scriptable" (gratuit, iOS & Android)
//   2. Coller ce script dans un nouveau script Scriptable
//   3. Ajouter un widget Scriptable sur l'écran d'accueil
//   4. Choisir ce script, taille "Small"
//   5. (Optionnel) Paramètre du widget : montant RSD à afficher, ex: "5000"
// ─────────────────────────────────────────────────────

const AMOUNT  = parseInt(args.widgetParameter) || 1000;
const API_URL = "https://api.frankfurter.app/latest?from=RSD&to=EUR";

async function getRate() {
  try {
    const req = new Request(API_URL);
    req.timeoutInterval = 6;
    const data = await req.loadJSON();
    return { rate: data.rates.EUR, date: data.date, offline: false };
  } catch {
    // Taux de secours si pas de réseau
    return { rate: 1 / 117.5, date: null, offline: true };
  }
}

const { rate, date, offline } = await getRate();
const eur = (AMOUNT * rate).toFixed(2);

// ── Widget ──────────────────────────────────────────
const w = new ListWidget();
w.setPadding(14, 16, 12, 16);
w.refreshAfterDate = new Date(Date.now() + 60 * 60 * 1000); // refresh toutes les heures

const grad = new LinearGradient();
grad.colors   = [new Color("#16213e"), new Color("#0f3460")];
grad.locations = [0.0, 1.0];
w.backgroundGradient = grad;

// ── Ligne 1 : drapeaux + statut ──────────────────────
const top = w.addStack();
top.layoutHorizontally();
top.centerAlignContent();

const flags = top.addText("🇷🇸  ›  🇪🇺");
flags.font      = Font.systemFont(13);
flags.textColor = Color.white();

top.addSpacer();

const badge = top.addText(offline ? "⚡ estimé" : "● live");
badge.font      = Font.mediumSystemFont(9);
badge.textColor = offline ? new Color("#facc15") : new Color("#4ade80");

w.addSpacer(10);

// ── Ligne 2 : montant RSD ────────────────────────────
const rsdLine = w.addText(AMOUNT.toLocaleString("fr-FR") + " RSD");
rsdLine.font      = Font.mediumSystemFont(12);
rsdLine.textColor = new Color("#ffffff", 0.55);

w.addSpacer(3);

// ── Ligne 3 : résultat EUR (gros) ────────────────────
const eurLine = w.addText(eur + " €");
eurLine.font              = Font.boldSystemFont(34);
eurLine.textColor         = new Color("#7dd3fc");
eurLine.minimumScaleFactor = 0.55;
eurLine.lineLimit         = 1;

w.addSpacer(10);

// ── Ligne 4 : taux unitaire ──────────────────────────
const rateLine = w.addText("1 RSD = " + rate.toFixed(5) + " €");
rateLine.font      = Font.systemFont(9);
rateLine.textColor = new Color("#ffffff", 0.35);

// ── Ligne 5 : date BCE ───────────────────────────────
if (date) {
  const d       = new Date(date);
  const dateStr = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  const dateLine = w.addText("BCE · " + dateStr);
  dateLine.font      = Font.systemFont(9);
  dateLine.textColor = new Color("#ffffff", 0.22);
}

Script.setWidget(w);
if (config.runsInApp) w.presentSmall();
Script.complete();

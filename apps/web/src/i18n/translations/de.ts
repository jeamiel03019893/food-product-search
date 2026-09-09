import type { Dictionary } from "../dictionary";

export const de: Dictionary = {
  common: {
    productImageAlt: "Produktbild",
  },
  language: {
    ariaLabel: "Sprache",
  },
  nav: {
    userMenu: "Benutzermenü",
    account: "Konto",
    subscription: "Abonnement",
  },
  app: {
    title: "Produktsuche - Bewertung",
  },
  search: {
    placeholder: "Nach einem Produktnamen suchen…",
    ariaLabel: "Produkte suchen",
    submit: "Suchen",
    recentSearchesLabel: "Letzte Suchanfragen",
  },
  table: {
    columnName: "Name",
    columnBrand: "Marke",
    view: "Ansehen",
    fetchError: "Beim Abrufen der Produkte ist ein Fehler aufgetreten.",
    empty: "Keine Produkte verfügbar",
    pageIndicator: "Seite {page} von {pageCount}",
    previous: "Zurück",
    next: "Weiter",
  },
  product: {
    detailsTitle: "Produktdetails",
    notFound: "Produkt nicht gefunden.",
    loadError: "Beim Laden dieses Produkts ist ein Fehler aufgetreten.",
    unknownBrand: "Unbekannte Marke",
    ingredients: "Zutaten",
    nutrition: "Nährwerte (pro 100g)",
    noNutrition: "Keine Nährwertangaben verfügbar.",
    subscribeGate:
      "Abonnieren, um detaillierte Nährwertinformationen für dieses Produkt zu sehen.",
  },
  subscription: {
    noSubscription: "Kein Abonnement",
    activeLabel: "{interval} Abonnement",
    interval: {
      day: "Tägliches",
      week: "Wöchentliches",
      month: "Monatliches",
      year: "Jährliches",
    },
    unit: {
      day: "Tag",
      week: "Woche",
      month: "Monat",
      year: "Jahr",
    },
    tooltip: "Klicken zum Abonnieren",
    modalTitle: "Abonnementpläne",
    modalDescriptionSubscribed:
      "Sie haben ein aktives Abonnement. Die Auswahl eines anderen Plans wechselt Sie dorthin.",
    modalDescriptionUnsubscribed:
      "Abonnieren, um detaillierte Nährwertinformationen freizuschalten.",
    loadError:
      "Abonnementpläne konnten nicht geladen werden. Bitte versuchen Sie es erneut.",
    noPlans: "Derzeit sind keine Abonnementpläne verfügbar.",
    currentPlan: "Aktueller Plan",
    switchPlan: "Zu diesem Plan wechseln",
    subscribe: "Abonnieren",
    defaultPlanName: "Abonnement",
    billedPer: "Abgerechnet pro {interval}",
    oneTime: "Einmalig",
    overlayMessage: "Ihr Abonnement wird verarbeitet…",
    toastRedirecting: "Weiterleitung zur Kasse…",
    toastSwitching:
      "Aktuelles Abonnement wird gekündigt und zur Kasse weitergeleitet…",
    toastCheckoutError: "Kasse konnte nicht gestartet werden",
    toastSwitchError: "Plan konnte nicht gewechselt werden",
    confirmTitle: "Abonnementplan wechseln?",
    confirmDescription:
      "Dies kündigt Ihr aktuelles Abonnement und startet ein neues für den ausgewählten Plan.",
    keepPlan: "Aktuellen Plan behalten",
    confirmSwitch: "Kündigen & wechseln",
    switchingInProgress: "Wird gewechselt…",
    cancelSubscription: "Abonnement kündigen",
    cancelConfirmTitle: "Abonnement kündigen?",
    cancelConfirmDescription:
      "Dies kündigt Ihr Abonnement sofort — Sie verlieren sofort den Zugriff auf detaillierte Nährwertinformationen.",
    keepSubscription: "Abonnement behalten",
    confirmCancel: "Ja, kündigen",
    cancellingInProgress: "Wird gekündigt…",
    toastCancelling: "Ihr Abonnement wird gekündigt…",
    toastCancelError: "Abonnement konnte nicht gekündigt werden",
  },
  languageSwitch: {
    overlayMessage: "Sprache wird aktualisiert…",
  },
};

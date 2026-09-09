import type { Dictionary } from "../dictionary";

export const nl: Dictionary = {
  common: {
    productImageAlt: "Productafbeelding",
  },
  language: {
    ariaLabel: "Taal",
  },
  nav: {
    userMenu: "Gebruikersmenu",
    account: "Account",
    subscription: "Abonnement",
  },
  app: {
    title: "Productzoeker - Beoordeling",
  },
  search: {
    placeholder: "Zoek een product op naam…",
    ariaLabel: "Producten zoeken",
    submit: "Zoeken",
    recentSearchesLabel: "Recente zoekopdrachten",
  },
  table: {
    columnName: "Naam",
    columnBrand: "Merk",
    view: "Bekijken",
    fetchError: "Er is iets misgegaan bij het ophalen van producten.",
    empty: "Geen producten beschikbaar",
    pageIndicator: "Pagina {page} van {pageCount}",
    previous: "Vorige",
    next: "Volgende",
  },
  product: {
    detailsTitle: "Productdetails",
    notFound: "Product niet gevonden.",
    loadError: "Er is iets misgegaan bij het laden van dit product.",
    unknownBrand: "Onbekend merk",
    ingredients: "Ingrediënten",
    nutrition: "Voedingswaarde (per 100g)",
    noNutrition: "Geen voedingsgegevens beschikbaar.",
    subscribeGate:
      "Abonneer om gedetailleerde voedingsinformatie voor dit product te zien.",
  },
  subscription: {
    noSubscription: "Geen Abonnement",
    activeLabel: "{interval} Abonnement",
    interval: {
      day: "Dagelijks",
      week: "Wekelijks",
      month: "Maandelijks",
      year: "Jaarlijks",
    },
    unit: {
      day: "dag",
      week: "week",
      month: "maand",
      year: "jaar",
    },
    tooltip: "Klik om te abonneren",
    modalTitle: "Abonnementen",
    modalDescriptionSubscribed:
      "Je hebt een actief abonnement. Als je een ander plan kiest, wordt je daarnaar overgezet.",
    modalDescriptionUnsubscribed:
      "Abonneer om gedetailleerde voedingsinformatie te ontgrendelen.",
    loadError: "Kan abonnementen niet laden. Probeer het opnieuw.",
    noPlans: "Er zijn momenteel geen abonnementen beschikbaar.",
    currentPlan: "Huidig plan",
    switchPlan: "Overstappen naar dit plan",
    subscribe: "Abonneren",
    defaultPlanName: "Abonnement",
    billedPer: "Gefactureerd per {interval}",
    oneTime: "Eenmalig",
    overlayMessage: "Je abonnement wordt verwerkt…",
    toastRedirecting: "Doorsturen naar afrekenen…",
    toastSwitching:
      "Huidig abonnement opzeggen en doorsturen naar afrekenen…",
    toastCheckoutError: "Kon afrekenen niet starten",
    toastSwitchError: "Kon niet van abonnement wisselen",
    confirmTitle: "Abonnement wijzigen?",
    confirmDescription:
      "Dit zegt je huidige abonnement op en start een nieuw abonnement voor het gekozen plan.",
    keepPlan: "Huidig plan behouden",
    confirmSwitch: "Opzeggen & wisselen",
    switchingInProgress: "Bezig met wisselen…",
    cancelSubscription: "Abonnement opzeggen",
    cancelConfirmTitle: "Abonnement opzeggen?",
    cancelConfirmDescription:
      "Dit zegt je abonnement onmiddellijk op — je verliest direct toegang tot gedetailleerde voedingsinformatie.",
    keepSubscription: "Abonnement behouden",
    confirmCancel: "Ja, opzeggen",
    cancellingInProgress: "Bezig met opzeggen…",
    toastCancelling: "Je abonnement wordt opgezegd…",
    toastCancelError: "Kon abonnement niet opzeggen",
  },
  languageSwitch: {
    overlayMessage: "Taal wordt bijgewerkt…",
  },
};

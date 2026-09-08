import type { Dictionary } from "../dictionary";

export const fr: Dictionary = {
  common: {
    productImageAlt: "Image du produit",
  },
  language: {
    ariaLabel: "Langue",
  },
  nav: {
    userMenu: "Menu utilisateur",
    account: "Compte",
    subscription: "Abonnement",
  },
  app: {
    title: "Recherche de produits - Évaluation",
  },
  search: {
    placeholder: "Rechercher un produit par nom…",
    ariaLabel: "Rechercher des produits",
    submit: "Rechercher",
  },
  table: {
    columnName: "Nom",
    columnBrand: "Marque",
    view: "Voir",
    fetchError:
      "Une erreur s'est produite lors de la récupération des produits.",
    empty: "Aucun produit disponible",
    pageIndicator: "Page {page} sur {pageCount}",
    previous: "Précédent",
    next: "Suivant",
  },
  product: {
    detailsTitle: "Détails du produit",
    notFound: "Produit introuvable.",
    loadError:
      "Une erreur s'est produite lors du chargement de ce produit.",
    unknownBrand: "Marque inconnue",
    ingredients: "Ingrédients",
    nutrition: "Valeurs nutritionnelles (pour 100 g)",
    noNutrition: "Aucune donnée nutritionnelle disponible.",
    subscribeGate:
      "Abonnez-vous pour voir les informations nutritionnelles détaillées de ce produit.",
  },
  subscription: {
    noSubscription: "Aucun Abonnement",
    activeLabel: "Abonnement {interval}",
    interval: {
      day: "Journalier",
      week: "Hebdomadaire",
      month: "Mensuel",
      year: "Annuel",
    },
    unit: {
      day: "jour",
      week: "semaine",
      month: "mois",
      year: "an",
    },
    tooltip: "Cliquez pour vous abonner",
    modalTitle: "Plans d'abonnement",
    modalDescriptionSubscribed:
      "Vous avez un abonnement actif. Sélectionner un autre plan vous y fera passer.",
    modalDescriptionUnsubscribed:
      "Abonnez-vous pour débloquer les informations nutritionnelles détaillées.",
    loadError:
      "Impossible de charger les plans d'abonnement. Veuillez réessayer.",
    noPlans: "Aucun plan d'abonnement n'est disponible pour le moment.",
    currentPlan: "Plan actuel",
    switchPlan: "Passer à ce plan",
    subscribe: "S'abonner",
    defaultPlanName: "Abonnement",
    billedPer: "Facturé par {interval}",
    oneTime: "Paiement unique",
    overlayMessage: "Traitement de votre abonnement…",
    toastRedirecting: "Redirection vers le paiement…",
    toastSwitching:
      "Annulation de l'abonnement actuel et redirection vers le paiement…",
    toastCheckoutError: "Impossible de démarrer le paiement",
    toastSwitchError: "Impossible de changer de plan",
    confirmTitle: "Changer de plan d'abonnement ?",
    confirmDescription:
      "Cela annulera votre abonnement actuel et en démarrera un nouveau pour le plan sélectionné.",
    keepPlan: "Conserver le plan actuel",
    confirmSwitch: "Annuler et changer",
    switchingInProgress: "Changement en cours…",
    cancelSubscription: "Annuler l'abonnement",
    cancelConfirmTitle: "Annuler l'abonnement ?",
    cancelConfirmDescription:
      "Cela annulera votre abonnement immédiatement — vous perdrez immédiatement l'accès aux informations nutritionnelles détaillées.",
    keepSubscription: "Conserver l'abonnement",
    confirmCancel: "Oui, annuler",
    cancellingInProgress: "Annulation en cours…",
    toastCancelling: "Annulation de votre abonnement…",
    toastCancelError: "Impossible d'annuler l'abonnement",
  },
  languageSwitch: {
    overlayMessage: "Mise à jour de la langue…",
  },
};

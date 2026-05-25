/**
 * Utility per la gestione dei conti finanziari e casse in VitaOS 2.1.
 * Gestisce la fusione del portafoglio contante permanente con i conti configurabili.
 */

export function getAccounts(userConfig) {
  // Contanti (Cassa nativa permanente)
  const cashAccount = {
    id: 'cash',
    name: 'Contanti',
    initial_balance: parseFloat(userConfig?.initial_cash_balance || 0),
    color: '#d4a017', // Giallo ambra
    icon: 'Wallet',
    is_permanent: true
  }

  // Conti personalizzabili dell'utente
  let customList = []
  
  if (userConfig?.custom_accounts) {
    try {
      customList = typeof userConfig.custom_accounts === 'string'
        ? JSON.parse(userConfig.custom_accounts)
        : userConfig.custom_accounts
    } catch (e) {
      console.error("Errore nel parsing dei conti personalizzati:", e)
      customList = []
    }
  } else {
    // Fallback di default retrocompatibile (Banco, Revolut, PostePay)
    customList = [
      { 
        id: 'bank', 
        name: 'Banco', 
        initial_balance: parseFloat(userConfig?.initial_bank_balance || 0), 
        color: '#4a90d9', 
        icon: 'Building' 
      },
      { 
        id: 'revolut', 
        name: 'Revolut', 
        initial_balance: 0, 
        color: '#9b59b6', 
        icon: 'CreditCard' 
      },
      { 
        id: 'postepay', 
        name: 'PostePay', 
        initial_balance: 0, 
        color: '#e05252', 
        icon: 'CreditCard' 
      }
    ]
  }

  return [cashAccount, ...customList]
}

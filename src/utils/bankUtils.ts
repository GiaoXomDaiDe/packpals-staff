interface Bank {
    code: string
    name: string
    shortName: string
}

const BANKS: Bank[] = [
    { code: 'VCB', name: 'Vietcombank', shortName: 'VCB' },
    { code: 'TCB', name: 'Techcombank', shortName: 'TCB' },
    { code: 'BIDV', name: 'BIDV', shortName: 'BIDV' },
    { code: 'VTB', name: 'Vietinbank', shortName: 'VTB' },
    { code: 'STB', name: 'Sacombank', shortName: 'STB' },
    { code: 'MB', name: 'MB Bank', shortName: 'MB' },
    { code: 'ACB', name: 'ACB', shortName: 'ACB' },
    { code: 'TPB', name: 'TPBank', shortName: 'TPB' },
    { code: 'SHB', name: 'SHB', shortName: 'SHB' },
    { code: 'VPB', name: 'VPBank', shortName: 'VPB' },
    { code: 'MSB', name: 'MSB', shortName: 'MSB' },
    { code: 'OCB', name: 'OCB', shortName: 'OCB' },
    { code: 'EIB', name: 'Eximbank', shortName: 'EIB' },
    { code: 'SEA', name: 'SeABank', shortName: 'SEA' },
    { code: 'HDBank', name: 'HDBank', shortName: 'HDBank' },
    { code: 'VAB', name: 'VietABank', shortName: 'VAB' },
    { code: 'NAB', name: 'Nam A Bank', shortName: 'NAB' },
    { code: 'PGB', name: 'PGBank', shortName: 'PGB' },
    { code: 'AGRI', name: 'Agribank', shortName: 'AGRI' },
    { code: 'BAB', name: 'BacABank', shortName: 'BAB' }
]

export interface ParsedBankAccount {
    accountNumber: string
    bankCode: string
    bankName: string
    bankShortName: string
    isValid: boolean
}

/**
 * Parse bank account string that contains account number + bank code
 * Example: "9704030199375327STB" -> { accountNumber: "9704030199375327", bankCode: "STB", bankName: "Sacombank", ... }
 */
export const parseBankAccount = (bankAccount: string): ParsedBankAccount => {
    if (!bankAccount || typeof bankAccount !== 'string') {
        return {
            accountNumber: '',
            bankCode: '',
            bankName: 'Unknown Bank',
            bankShortName: 'Unknown',
            isValid: false
        }
    }

    // Try to find bank code at the end of the string
    let bankCode = ''
    let accountNumber = ''
    
    // Check for each bank code, starting from longest to shortest to avoid partial matches
    const sortedBanks = BANKS.sort((a, b) => b.code.length - a.code.length)
    
    for (const bank of sortedBanks) {
        if (bankAccount.endsWith(bank.code)) {
            bankCode = bank.code
            accountNumber = bankAccount.slice(0, -bank.code.length)
            break
        }
    }

    // If no bank code found, treat the whole string as account number
    if (!bankCode) {
        return {
            accountNumber: bankAccount,
            bankCode: '',
            bankName: 'Unknown Bank',
            bankShortName: 'Unknown',
            isValid: false
        }
    }

    const bank = BANKS.find(b => b.code === bankCode)
    
    return {
        accountNumber,
        bankCode,
        bankName: bank?.name || 'Unknown Bank',
        bankShortName: bank?.shortName || 'Unknown',
        isValid: true
    }
}

/**
 * Format bank account for display
 */
export const formatBankAccount = (bankAccount: string): string => {
    const parsed = parseBankAccount(bankAccount)
    
    if (!parsed.isValid) {
        return bankAccount
    }

    // Format account number with spaces for readability
    const formattedNumber = parsed.accountNumber.replace(/(\d{4})/g, '$1 ').trim()
    
    return `${formattedNumber} (${parsed.bankShortName})`
}

export { BANKS }
export type { Bank }

/**
 * Format currency amount for display
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};


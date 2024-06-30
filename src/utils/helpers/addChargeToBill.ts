
export function calculateBillingAmount(amount : number, processorPercentage : number, processorExtraAmount : number) {
  
    const trueAmount = amount * 100 //Convert to subunit

    const percentageToPay = trueAmount * (processorPercentage/100)

    const result = trueAmount + percentageToPay + processorExtraAmount;

    return result
   
}


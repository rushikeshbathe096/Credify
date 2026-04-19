import math

def calculate_emi_tenure(income, principal, rate):
    target_emi = 0.175 * income
    monthly_rate = (rate / 100.0) / 12.0
    
    if principal > 0 and target_emi > principal * monthly_rate:
        k = target_emi / (principal * monthly_rate)
        tenure_months = math.log(k / (k - 1)) / math.log(1 + monthly_rate)
        tenure_months = int(round(tenure_months))
        
        if tenure_months > 84:
            tenure_months = 84
        elif tenure_months < 6:
            tenure_months = 6
            
        power = (1 + monthly_rate) ** tenure_months
        emi = principal * monthly_rate * power / (power - 1)
    elif principal > 0:
        tenure_months = 84
        power = (1 + monthly_rate) ** tenure_months
        affordable_principal = target_emi * (power - 1) / (monthly_rate * power)
        principal = min(principal, affordable_principal)
        emi = target_emi
    else:
        emi = 0
        tenure_months = 0
        
    return int(principal), int(emi), int(tenure_months)

# Test case 1: Normal case
# Income: 100,000 -> Target EMI: 17,500
# Principal: 500,000, Rate: 10.5%
income = 100000
principal = 500000
rate = 10.5
p, e, t = calculate_emi_tenure(income, principal, rate)
print(f"Test 1: Income={income}, Principal={principal}, Rate={rate}%")
print(f"Result: Principal={p}, EMI={e}, Tenure={t} months")
print(f"EMI percentage of income: {e/income:.2%}")

# Test case 2: Low income (EMI doesn't cover interest)
# Income: 20,000 -> Target EMI: 3,500
# Principal: 1,000,000, Rate: 12% -> Monthly interest: 10,000
# Expected: Principal reduced to what 3,500 can buy in 84 months.
income = 20000
principal = 1000000
rate = 12.0
p, e, t = calculate_emi_tenure(income, principal, rate)
print(f"\nTest 2: Income={income}, Principal={principal}, Rate={rate}%")
print(f"Result: Principal={p}, EMI={e}, Tenure={t} months")
print(f"EMI percentage of income: {e/income:.2%}")

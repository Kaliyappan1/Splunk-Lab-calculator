"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SoftmaniaLogo } from "@/components/softmania-logo"
import {
  Calculator,
  DollarSign,
  Clock,
  Server,
  HardDrive,
  Users,
  ArrowRightLeft,
  Info,
  AlertTriangle,
  Download,
  Calendar,
  IndianRupee,
} from "lucide-react"

export default function SplunkBudgetCalculator() {
  // Input states
  const [budget, setBudget] = useState(3000)
  const [runtimePerDay, setRuntimePerDay] = useState(5)
  const [instancesPerPerson, setInstancesPerPerson] = useState(9)
  const [storagePerInstance, setStoragePerInstance] = useState(30)
  const [numberOfUsers, setNumberOfUsers] = useState(1)
  const [exchangeRate, setExchangeRate] = useState(84)
  const [desiredDays, setDesiredDays] = useState(10)

  // Deployment type states
  const [deploymentType, setDeploymentType] = useState<"standalone" | "non-clustered" | "clustered">("clustered")
  const [maintenanceCostEnabled, setMaintenanceCostEnabled] = useState(false)

  // Toggle mode: false = Days→Budget (PRIMARY), true = Budget→Days
  const [budgetToDays, setBudgetToDays] = useState(false)

  // Calculation results
  const [results, setResults] = useState({
    dailyCostINR: 0,
    dailyCostUSD: 0,
    instanceCostINR: 0,
    instanceCostUSD: 0,
    storageCostINR: 0,
    storageCostUSD: 0,
    affordableDays: 0,
    requiredBudgetINR: 0,
    requiredBudgetUSD: 0,
    totalBudgetUsed: 0,
  })

  // AWS pricing constants
  const EC2_RATE_USD = 0.0464 // per hour for t2.medium
  const STORAGE_RATE_USD = 0.08 // per GB per month for gp3

  useEffect(() => {
    calculateCosts()
  }, [
    budget,
    runtimePerDay,
    instancesPerPerson,
    storagePerInstance,
    numberOfUsers,
    exchangeRate,
    desiredDays,
    budgetToDays,
    deploymentType,
    maintenanceCostEnabled,
  ])

  const calculateCosts = () => {
    // Instance cost calculation
    const instanceCostUSD = EC2_RATE_USD * runtimePerDay * instancesPerPerson * numberOfUsers
    const instanceCostINR = instanceCostUSD * exchangeRate

    // Storage cost calculation (monthly to daily)
    const storageCostMonthlyUSD = STORAGE_RATE_USD * storagePerInstance * instancesPerPerson * numberOfUsers
    const storageCostUSD = storageCostMonthlyUSD / 30
    const storageCostINR = storageCostUSD * exchangeRate

    // Base daily cost
    const baseDailyCostUSD = instanceCostUSD + storageCostUSD
    const baseDailyCostINR = baseDailyCostUSD * exchangeRate

    // Apply maintenance cost if enabled
    const maintenanceMultiplier = maintenanceCostEnabled ? 1.25 : 1
    const dailyCostUSD = baseDailyCostUSD * maintenanceMultiplier
    const dailyCostINR = baseDailyCostINR * maintenanceMultiplier

    if (budgetToDays) {
      // Calculate affordable days
      const affordableDays = budget / dailyCostINR
      const totalBudgetUsed = Math.floor(affordableDays) * dailyCostINR

      setResults({
        dailyCostINR,
        dailyCostUSD,
        instanceCostINR: instanceCostINR * maintenanceMultiplier,
        instanceCostUSD: instanceCostUSD * maintenanceMultiplier,
        storageCostINR: storageCostINR * maintenanceMultiplier,
        storageCostUSD: storageCostUSD * maintenanceMultiplier,
        affordableDays,
        requiredBudgetINR: 0,
        requiredBudgetUSD: 0,
        totalBudgetUsed,
      })
    } else {
      // Calculate required budget
      const requiredBudgetINR = desiredDays * dailyCostINR
      const requiredBudgetUSD = requiredBudgetINR / exchangeRate

      setResults({
        dailyCostINR,
        dailyCostUSD,
        instanceCostINR: instanceCostINR * maintenanceMultiplier,
        instanceCostUSD: instanceCostUSD * maintenanceMultiplier,
        storageCostINR: storageCostINR * maintenanceMultiplier,
        storageCostUSD: storageCostUSD * maintenanceMultiplier,
        affordableDays: 0,
        requiredBudgetINR,
        requiredBudgetUSD,
        totalBudgetUsed: 0,
      })
    }
  }

  const handleDeploymentTypeChange = (type: "standalone" | "non-clustered" | "clustered") => {
    setDeploymentType(type)
    // Set default instances based on deployment type
    switch (type) {
      case "standalone":
        setInstancesPerPerson(1)
        break
      case "non-clustered":
        setInstancesPerPerson(4)
        break
      case "clustered":
        setInstancesPerPerson(9)
        break
    }
  }

  const shouldShowOptimizationTip = () => {
    return results.dailyCostINR > 250 || (budgetToDays && results.affordableDays < 10)
  }

  const generatePDFReport = () => {
    const currentDate = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const reportHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Splunk Lab Budget Report - Soft Mania</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                line-height: 1.6; 
                color: #1f2937;
                background: white;
            }
            .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
            .header { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 3px solid #10b981;
            }
            .logo { 
                display: flex; 
                align-items: center; 
                gap: 12px; 
            }
            .logo-icon { 
                width: 48px; 
                height: 48px; 
                background: linear-gradient(135deg, #10b981, #059669); 
                border-radius: 12px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: white; 
                font-weight: bold; 
                font-size: 24px;
                position: relative;
            }
            .logo-icon::after {
                content: '';
                position: absolute;
                bottom: -4px;
                right: -4px;
                width: 16px;
                height: 16px;
                background: #1f2937;
                border-radius: 50%;
            }
            .logo-text { 
                font-size: 28px; 
                font-weight: 800; 
                color: #1f2937; 
            }
            .logo-subtitle { 
                font-size: 12px; 
                color: #10b981; 
                font-weight: 600; 
            }
            .report-title { 
                font-size: 32px; 
                font-weight: bold; 
                color: #1f2937; 
                text-align: center; 
                margin-bottom: 8px; 
            }
            .report-subtitle { 
                text-align: center; 
                color: #6b7280; 
                margin-bottom: 40px; 
            }
            .section { 
                margin-bottom: 32px; 
                background: #f9fafb; 
                padding: 24px; 
                border-radius: 12px; 
                border-left: 4px solid #10b981;
            }
            .section-title { 
                font-size: 20px; 
                font-weight: bold; 
                margin-bottom: 16px; 
                color: #1f2937; 
            }
            .grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 16px; 
            }
            .grid-item { 
                background: white; 
                padding: 16px; 
                border-radius: 8px; 
                border: 1px solid #e5e7eb; 
            }
            .grid-item-label { 
                font-size: 14px; 
                color: #6b7280; 
                margin-bottom: 4px; 
            }
            .grid-item-value { 
                font-size: 18px; 
                font-weight: bold; 
                color: #1f2937; 
            }
            .highlight-box { 
                background: linear-gradient(135deg, #10b981, #059669); 
                color: white; 
                padding: 24px; 
                border-radius: 12px; 
                text-align: center; 
                margin: 24px 0; 
            }
            .highlight-value { 
                font-size: 36px; 
                font-weight: bold; 
                margin-bottom: 8px; 
            }
            .highlight-label { 
                font-size: 16px; 
                opacity: 0.9; 
            }
            .cost-breakdown { 
                background: white; 
                border: 1px solid #e5e7eb; 
                border-radius: 8px; 
                overflow: hidden; 
            }
            .cost-item { 
                display: flex; 
                justify-content: space-between; 
                padding: 16px; 
                border-bottom: 1px solid #f3f4f6; 
            }
            .cost-item:last-child { 
                border-bottom: none; 
                background: #f9fafb; 
                font-weight: bold; 
            }
            .footer { 
                margin-top: 60px; 
                padding-top: 20px; 
                border-top: 2px solid #e5e7eb; 
                text-align: center; 
            }
            .footer-logo { 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                gap: 8px; 
                margin-bottom: 12px; 
            }
            .footer-logo-icon { 
                width: 32px; 
                height: 32px; 
                background: linear-gradient(135deg, #10b981, #059669); 
                border-radius: 8px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: white; 
                font-weight: bold; 
                font-size: 16px;
                position: relative;
            }
            .footer-logo-icon::after {
                content: '';
                position: absolute;
                bottom: -2px;
                right: -2px;
                width: 10px;
                height: 10px;
                background: #1f2937;
                border-radius: 50%;
            }
            .tagline { 
                color:rgb(41, 41, 41); 
                font-weight: 600; 
                font-size: 14px; 
            }
            .footer-text { 
                color: #6b7280; 
                font-size: 12px; 
                margin-top: 8px; 
            }
            @media print {
                body { -webkit-print-color-adjust: exact; }
                .container { padding: 20px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">
                    <div>
                        <div class="logo-text"><span style=" color: #2f855a;">Soft</span> Mania</div>
                    </div>
                </div>
                <div style="text-align: right; color: #6b7280; font-size: 14px;">
                    <div>Report Generated</div>
                    <div style="font-weight: 600;">${currentDate}</div>
                </div>
            </div>

            <div class="report-title">Splunk Lab Budget Analysis</div>
            <div class="report-subtitle">Cost Estimation Report</div>

            <div class="section">
                <div class="section-title">Configuration Summary</div>
                <div class="grid">
                    <div class="grid-item">
                        <div class="grid-item-label">Deployment Type</div>
                        <div class="grid-item-value">${deploymentType.charAt(0).toUpperCase() + deploymentType.slice(1).replace("-", " ")}</div>
                    </div>
                    <div class="grid-item">
                        <div class="grid-item-label">Runtime per Day</div>
                        <div class="grid-item-value">${runtimePerDay} hours</div>
                    </div>
                    <div class="grid-item">
                        <div class="grid-item-label">Instances per Person</div>
                        <div class="grid-item-value">${instancesPerPerson}</div>
                    </div>
                    <div class="grid-item">
                        <div class="grid-item-label">Number of Users</div>
                        <div class="grid-item-value">${numberOfUsers}</div>
                    </div>
                    <div class="grid-item">
                        <div class="grid-item-label">Storage per Instance</div>
                        <div class="grid-item-value">${storagePerInstance} GB</div>
                    </div>
                    <div class="grid-item">
                        <div class="grid-item-label">Exchange Rate</div>
                        <div class="grid-item-value">₹${exchangeRate}/USD</div>
                    </div>
                </div>
            </div>

            ${
              budgetToDays
                ? `
            <div class="highlight-box">
                <div class="highlight-value">${Math.floor(results.affordableDays)} Days</div>
                <div class="highlight-label">Estimated Runtime within ₹${budget} Budget</div>
            </div>
            `
                : `
            <div class="highlight-box">
                <div class="highlight-value">₹${results.requiredBudgetINR.toFixed(2)}</div>
                <div class="highlight-label">Required Budget for ${desiredDays} Days</div>
            </div>
            `
            }

            ${
              numberOfUsers > 1
                ? `
<div class="section">
    <div class="section-title">Per Person Analysis</div>
    <div class="grid">
        <div class="grid-item">
            <div class="grid-item-label">${!budgetToDays ? "Required Budget per Person" : "Runtime per Person"}</div>
            <div class="grid-item-value">${
              !budgetToDays
                ? `₹${(results.requiredBudgetINR / numberOfUsers).toFixed(2)}`
                : `${Math.floor(results.affordableDays)} Days`
            }</div>
        </div>
        <div class="grid-item">
            <div class="grid-item-label">Daily Cost per Person</div>
            <div class="grid-item-value">₹${(results.dailyCostINR / numberOfUsers).toFixed(2)}</div>
        </div>
        <div class="grid-item">
            <div class="grid-item-label">Instance Cost per Person</div>
            <div class="grid-item-value">₹${(results.instanceCostINR / numberOfUsers).toFixed(2)}</div>
        </div>
        <div class="grid-item">
            <div class="grid-item-label">Storage Cost per Person</div>
            <div class="grid-item-value">₹${(results.storageCostINR / numberOfUsers).toFixed(2)}</div>
        </div>
    </div>
</div>
`
                : ""
            }

<div class="section">
    <div class="section-title">${numberOfUsers > 1 ? `Total Daily Cost Breakdown (${numberOfUsers} Users)` : "Daily Cost Breakdown"}</div>
    <div class="cost-breakdown">
        <div class="cost-item">
            <span>Instance Cost (${instancesPerPerson} × ${numberOfUsers} × ${runtimePerDay}h)</span>
            <div style="text-align: right;">
                <div>₹${results.instanceCostINR.toFixed(2)}</div>
                ${numberOfUsers > 1 ? `<div style="font-size: 12px; color: #6b7280;">₹${(results.instanceCostINR / numberOfUsers).toFixed(2)} per person</div>` : ""}
            </div>
        </div>
        <div class="cost-item">
            <span>Storage Cost (${storagePerInstance}GB × ${instancesPerPerson} × ${numberOfUsers})</span>
            <div style="text-align: right;">
                <div>₹${results.storageCostINR.toFixed(2)}</div>
                ${numberOfUsers > 1 ? `<div style="font-size: 12px; color: #6b7280;">₹${(results.storageCostINR / numberOfUsers).toFixed(2)} per person</div>` : ""}
            </div>
        </div>
        ${
          maintenanceCostEnabled
            ? `
        <div class="cost-item">
            <span>Maintenance Cost (+25%)</span>
            <div style="text-align: right;">
                <div>₹${((results.instanceCostINR + results.storageCostINR) * 0.25).toFixed(2)}</div>
                ${numberOfUsers > 1 ? `<div style="font-size: 12px; color: #6b7280;">₹${(((results.instanceCostINR + results.storageCostINR) * 0.25) / numberOfUsers).toFixed(2)} per person</div>` : ""}
            </div>
        </div>
        `
            : ""
        }
        <div class="cost-item">
            <span>Total Daily Cost</span>
            <div style="text-align: right;">
                <div>₹${results.dailyCostINR.toFixed(2)}</div>
                ${numberOfUsers > 1 ? `<div style="font-size: 12px; color: #6b7280;">₹${(results.dailyCostINR / numberOfUsers).toFixed(2)} per person</div>` : ""}
            </div>
        </div>
    </div>
</div>

            <div class="section">
                <div class="section-title">AWS Pricing Reference</div>
                <div class="grid">
                    <div class="grid-item">
                        <div class="grid-item-label">EC2 (t2.medium)</div>
                        <div class="grid-item-value">$0.0464/hour</div>
                    </div>
                    <div class="grid-item">
                        <div class="grid-item-label">gp3 Storage</div>
                        <div class="grid-item-value">$0.08/GB-month</div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <div class="footer-logo">
                    <div>
                        <div style="font-weight: 800; color: #10b981;">Soft Mania</div>
                        <div class="tagline">No matter how many documents, No matter how many tutorials, It is always practical knowledge that wins the game.</div>
                    </div>
                </div>
                <div class="footer-text">
                    This report was generated using Soft Mania's Splunk Lab Budget Calculator<br>
                    For support and inquiries, contact our technical team
                </div>
            </div>
        </div>
    </body>
    </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(reportHTML)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header with Logo - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
            <div className="order-2 sm:order-1">
              <SoftmaniaLogo size="md" />
            </div>
            <div className="text-center flex-1 order-1 sm:order-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2 font-heading flex-wrap">
                
                <span className="text-center">Splunk Lab Budget Calculator</span>
              </h1>
            </div>
            <div className="w-0 sm:w-32 lg:w-48 order-3"></div> {/* Spacer for balance on desktop */}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 font-heading">
                      <ArrowRightLeft className="h-5 w-5" />
                      Configuration
                    </CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="mode-toggle" className="text-sm font-medium">
                      {budgetToDays ? "Budget → Days" : "Days → Budget"}
                    </Label>
                    <Switch
                      id="mode-toggle"
                      checked={budgetToDays}
                      onCheckedChange={(checked) => setBudgetToDays(checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Deployment Type Tabs */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Deployment Type</Label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <button
                      onClick={() => handleDeploymentTypeChange("standalone")}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        deploymentType === "standalone"
                          ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      Standalone
                    </button>
                    <button
                      onClick={() => handleDeploymentTypeChange("non-clustered")}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        deploymentType === "non-clustered"
                          ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      Non-Clustered
                    </button>
                    <button
                      onClick={() => handleDeploymentTypeChange("clustered")}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        deploymentType === "clustered"
                          ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      Splunk Clustered
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {deploymentType === "standalone" && "• Single instance deployment for basic testing"}
                    {deploymentType === "non-clustered" &&
                      "• Multiple instances without clustering for medium workloads"}
                    {deploymentType === "clustered" && "• Full clustered deployment for production-like environments"}
                  </div>
                </div>

                {!budgetToDays ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="days" className="text-base font-bold">Desired Days</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of days you want to run the lab</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="days"
                      type="number"
                      value={desiredDays}
                      onChange={(e) => setDesiredDays(Number(e.target.value))}
                      className="text-xl border-green-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                      <Label htmlFor="budget" className="text-base font-bold">Budget (₹)</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total spendable budget in Indian Rupees</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="budget"
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="text-xl border-green-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <Label htmlFor="runtime">Runtime/Day (hrs)</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>How many hours the lab will run daily</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="runtime"
                      type="number"
                      value={runtimePerDay}
                      onChange={(e) => setRuntimePerDay(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-purple-600" />
                      <Label htmlFor="instances">Instances/Person</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of EC2 instances per user</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="instances"
                      type="number"
                      value={instancesPerPerson}
                      onChange={(e) => setInstancesPerPerson(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-red-600" />
                      <Label htmlFor="storage">Storage/Instance (GB)</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>SSD volume (gp3) per instance in GB</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="storage"
                      type="number"
                      value={storagePerInstance}
                      onChange={(e) => setStoragePerInstance(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-teal-600" />
                      <Label htmlFor="users" className="text-base font-bold">Number of Users</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total number of users/trainees</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="users"
                      type="number"
                      value={numberOfUsers}
                      onChange={(e) => setNumberOfUsers(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <Label htmlFor="exchange">Exchange Rate (USD to ₹)</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current USD to INR exchange rate</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="exchange"
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                  />
                </div>

                <div className="pt-4 space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>
                      <strong>AWS Pricing:</strong>
                    </p>
                    <p>• EC2 (t2.medium): $0.0464/hour</p>
                    <p>• gp3 Storage: $0.08/GB-month</p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <Label htmlFor="maintenance-toggle" className="text-sm font-medium">
                          Soft Mania Maintenance Cost (+25%)
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Additional 25% cost for professional maintenance and support services</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        id="maintenance-toggle"
                        checked={maintenanceCostEnabled}
                        onCheckedChange={setMaintenanceCostEnabled}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {maintenanceCostEnabled
                        ? "Maintenance cost included in calculations"
                        : "Base AWS pricing only"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <Calculator className="h-5 w-5" />
                  {!budgetToDays ? "Required Budget" : "Budget Analysis"}
                </CardTitle>
                
              </CardHeader>
              <CardContent className="space-y-4">
                {!budgetToDays ? (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400 font-heading tracking-tight">
                        ₹{results.requiredBudgetINR.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Required Budget</div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${results.requiredBudgetUSD.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">In USD</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 font-heading tracking-tight">
                        {Math.floor(results.affordableDays)} Days
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Estimated Runtime</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          ₹{results.totalBudgetUsed.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Budget Used</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          ₹{(budget - results.totalBudgetUsed).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Remaining</div>
                      </div>
                    </div>
                  </div>
                )}

                {numberOfUsers > 1 && (
                  <>
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Per Person Breakdown
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {!budgetToDays
                              ? `₹${(results.requiredBudgetINR / numberOfUsers).toFixed(2)}`
                              : `${Math.floor(results.affordableDays)} Days`}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {!budgetToDays ? "Required per Person" : "Runtime per Person"}
                          </div>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            ₹{(results.dailyCostINR / numberOfUsers).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Daily Cost per Person</div>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Cost Breakdown (Per Day) {numberOfUsers > 1 && `- ${numberOfUsers} Users Total`}
                  </h4>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Instance Cost</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{results.instanceCostINR.toFixed(2)}</div>
                        {numberOfUsers > 1 && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            ₹{(results.instanceCostINR / numberOfUsers).toFixed(2)} per person
                          </div>
                        )}
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          ${results.instanceCostUSD.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Storage Cost</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{results.storageCostINR.toFixed(2)}</div>
                        {numberOfUsers > 1 && (
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            ₹{(results.storageCostINR / numberOfUsers).toFixed(2)} per person
                          </div>
                        )}
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          ${results.storageCostUSD.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {maintenanceCostEnabled && (
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">Maintenance Cost (25%)</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ₹{((results.instanceCostINR + results.storageCostINR) * 0.25).toFixed(2)}
                          </div>
                          {numberOfUsers > 1 && (
                            <div className="text-xs text-green-600 dark:text-green-400">
                              ₹
                              {(((results.instanceCostINR + results.storageCostINR) * 0.25) / numberOfUsers).toFixed(2)}{" "}
                              per person
                            </div>
                          )}
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            ${((results.instanceCostUSD + results.storageCostUSD) * 0.25).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-orange-600" />
                        <span className="font-semibold">Total Daily Cost</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400 font-heading">
                          ₹{results.dailyCostINR.toFixed(2)}
                        </div>
                        {numberOfUsers > 1 && (
                          <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                            ₹{(results.dailyCostINR / numberOfUsers).toFixed(2)} per person
                          </div>
                        )}
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          ${results.dailyCostUSD.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {shouldShowOptimizationTip() && (
                  <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      <strong>💡 Cost Optimization Tip:</strong> Try reducing runtime hours or number of instances for
                      longer usage within your budget.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={generatePDFReport} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF Report
                  </Button>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                  Exchange Rate: ₹{exchangeRate} per USD
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Usage Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🎓 Training Labs</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Perfect for calculating costs for Splunk training sessions with multiple participants.
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">🧪 Development</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Estimate costs for development and testing environments before deployment.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">📊 POC Projects</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Budget planning for proof-of-concept implementations and demos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}

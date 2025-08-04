// const fetch = require('node-fetch');
import fetch from 'node-fetch';

const API_URL = "https://assessment.ksensetech.com/api/patients?page=1&limit=10";
const API_KEY = "";

// Helper functions remain unchanged
function parseBP(bp) {
  if (typeof bp !== "string" || !bp.includes("/")) return { valid: false };
  const [systolicStr, diastolicStr] = bp.split("/");
  const systolic = parseInt(systolicStr);
  const diastolic = parseInt(diastolicStr);
  if (isNaN(systolic) || isNaN(diastolic)) return { valid: false };
  return { valid: true, systolic, diastolic };
}

function getBPRisk(bp) {
  const { valid, systolic, diastolic } = parseBP(bp);
  if (!valid) return { score: 0, invalid: true };
  if (systolic < 120 && diastolic < 80) return { score: 1 };
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) return { score: 2 };
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) return { score: 3 };
  if (systolic >= 140 || diastolic >= 90) return { score: 4 };
  return { score: 0, invalid: true };
}

function getTempRisk(temp) {
  if (typeof temp !== "number") return { score: 0, invalid: true };
  if (temp <= 99.5) return { score: 0 };
  if (temp <= 100.9) return { score: 1 };
  if (temp >= 101) return { score: 2 };
  return { score: 0, invalid: true };
}

function getAgeRisk(age) {
  if (typeof age !== "number") return { score: 0, invalid: true };
  if (age < 40) return { score: 1 };
  if (age <= 65) return { score: 1 };
  if (age > 65) return { score: 2 };
  return { score: 0, invalid: true };
}

// Main function
async function analyzePatients() {
  try {
    // Fetch the patients JSON
    const res = await fetch(API_URL, {
      headers: {
        "x-api-key": API_KEY
      }
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const json = await res.json();
    const patients = json.data;

    const high_risk_patients = [];
    const fever_patients = [];
    const data_quality_issues = [];

    for (const patient of patients) {
      const { patient_id, blood_pressure, temperature, age } = patient;

      const bp = getBPRisk(blood_pressure);
      const temp = getTempRisk(temperature);
      const ageRisk = getAgeRisk(age);

      const totalRisk = bp.score + temp.score + ageRisk.score;

      if (totalRisk >= 4) high_risk_patients.push(patient_id);
      if (typeof temperature === "number" && temperature >= 99.6) fever_patients.push(patient_id);
      if (bp.invalid || temp.invalid || ageRisk.invalid) data_quality_issues.push(patient_id);
    }

    const result = {
      high_risk_patients,
      fever_patients,
      data_quality_issues
    };

    console.log("Resulting risk analysis:");
    console.log(result);

    // Optional: POST result to an endpoint
    // await fetch("https://example.com/submit-risk-report", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json"
    //   },
    //   body: JSON.stringify(result)
    // });

    // await fetch('https://assessment.ksensetech.com/api/submit-assessment'

//     fetch('https://assessment.ksensetech.com/api/submit-assessment', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'x-api-key': API_KEY
//         },
//         body: JSON.stringify(result)
//       })

//   } catch (err) {
//     console.error("Error fetching or processing data:", err);
//   }

    fetch('https://assessment.ksensetech.com/api/submit-assessment', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
        },
        body: JSON.stringify(result)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Assessment Results:', data);
    });

    } catch (err) {
    console.error("Error fetching or processing data:", err);
  }

}


analyzePatients();


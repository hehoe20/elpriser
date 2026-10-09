const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Hent priser fra elprisenligenu.dk API for DK1 på en given dato (YYYY-MM-DD)
async function fetchElpriserData(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const url = `https://www.elprisenligenu.dk/api/v1/prices/${year}/${month}-${day}_DK1.json`;

    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        
        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Fejl ved hentning fra elprisenligenu.dk:", err);
        return null;
    }
}

// Beregn priser med de gældende Vores Elnet tariffer (opdateret pr. 1. oktober 2026)
// Beregn priser ud fra den faktiske danske time (00-23)
function calculatePrices(spotDkkPrKwh, localHour) {
    // 1. Uden afgifter (Rå spotpris inkl. 25% moms)
    const udenAfgifter = Number((spotDkkPrKwh * 1.25).toFixed(2));

    // 2. Med afgifter
    const spotPrisEksklMoms = spotDkkPrKwh;
    const energinetSamletEksklMoms = 0.114; // System- og nettariffer Energinet

    // Vores Elnet C-tariffer (vintermodel gældende fra 1. okt):
    // Lavlast: 00-06
    // Højlast: 06-17 og 21-24
    // Spidslast: 17-21
    let netTarifEksklMoms = 0.0769; // Lavlast (00:00 - 06:00)

    if (localHour >= 6 && localHour < 17) {
        netTarifEksklMoms = 0.2307; // Højlast dag (06:00 - 17:00)
    } else if (localHour >= 17 && localHour < 21) {
        netTarifEksklMoms = 0.6922; // Spidslast (17:00 - 21:00)
    } else if (localHour >= 21 && localHour < 24) {
        netTarifEksklMoms = 0.2307; // Højlast aften (21:00 - 24:00)
    }

    const elafgiftEksklMoms = 0.008; // Ca. 1 øre inkl. moms

    const totalEksklMoms = spotPrisEksklMoms + netTarifEksklMoms + energinetSamletEksklMoms + elafgiftEksklMoms;
    const medAfgifter = Number((totalEksklMoms * 1.25).toFixed(2));

    return {
        udenAfgifter,
        medAfgifter
    };
}

// I din app.get:
app.get('/api/prices/:date', async (req, res) => {
    let dateStr = req.params.date;
    
    const rawData = await fetchElpriserData(dateStr);
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        return res.status(404).json({ error: 'Ingen priser fundet for denne dato endnu.' });
    }

    const hours = [];
    const pricesUden = [];
    const pricesMed = [];

    for (const entry of rawData) {
        const spotDkkKwh = entry.DKK_per_kWh; 
        const timestamp = entry.time_start; // F.eks. "2026-10-09T17:00:00+02:00"

        if (spotDkkKwh !== undefined && timestamp) {
            // Træk lokal time direkte ud af strengen for at omgå UTC-forskydning i Docker
            const timePart = timestamp.split('T')[1].substring(0, 5); // "17:00"
            const localHour = parseInt(timePart.substring(0, 2), 10); // 17

            const calculated = calculatePrices(spotDkkKwh, localHour);
            
            hours.push(timePart);
            pricesUden.push(calculated.udenAfgifter);
            pricesMed.push(calculated.medAfgifter);
        }
    }

    res.json({
        date: dateStr,
        hours,
        pricesUden,
        pricesMed
    });
});

// API Endpoint til frontend
app.get('/api/prices/:date', async (req, res) => {
    let dateStr = req.params.date; // Format: YYYY-MM-DD
    
    const rawData = await fetchElpriserData(dateStr);
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        return res.status(404).json({ error: 'Ingen priser fundet for denne dato endnu.' });
    }

    const hours = [];
    const pricesUden = [];
    const pricesMed = [];

    for (const entry of rawData) {
        const spotDkkKwh = entry.DKK_per_kWh; 
        const timestamp = entry.time_start;

        if (spotDkkKwh !== undefined && timestamp) {
            const calculated = calculatePrices(spotDkkKwh, timestamp);
            
            // Fast x-akse fra 00:00 til 23:00
            const timePart = timestamp.split('T')[1].substring(0, 5);
            
            hours.push(timePart);
            pricesUden.push(calculated.udenAfgifter);
            pricesMed.push(calculated.medAfgifter);
        }
    }

    res.json({
        date: dateStr,
        hours,
        pricesUden,
        pricesMed
    });
});

app.listen(PORT, () => {
    console.log(`Server kører på http://localhost:${PORT}`);
});

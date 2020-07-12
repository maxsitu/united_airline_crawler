import {Page} from "puppeteer";

const PVG_XPATH = '//button[contains(@aria-label, "Shanghai (PVG - Pu Dong)")]';
const SFO_XPATH = '//button[contains(@aria-label, "San Francisco, CA, US (SFO)")]'

export async  function changeAirportsAndAdults(page: Page) {
    // Click on one-way tab
    const [oneway] = await page.$x("//a[contains(., 'One-way')] | //input[contains(@aria-label, 'One Way Flight')]");
    await oneway.click();

    await page.waitFor(500);

    // Input from airport
    const fromInput = await page.$('#originInput2, #bookFlightOriginInput');
    await fromInput?.click({clickCount: 3});
    await fromInput?.press('Backspace');
    await fromInput?.type('SFO');
    await page.waitForXPath(SFO_XPATH);
    const [sfo] = await page.$x(SFO_XPATH);
    await sfo.click();
    await page.waitFor(500);

    // Input to airport
    const toInput = await page.$('#destinationInput3, #bookFlightDestinationInput');
    await toInput?.click({clickCount: 3});
    await toInput?.press('Backspace');
    await toInput?.type('PVG');
    await page.waitForXPath(PVG_XPATH);
    const [pvg] = await page.$x(PVG_XPATH);
    await pvg.click();
    await page.waitFor(500);

    // Fill in adults
    await page.click('#travelerInput9, #bookFlightModel\\.passengers');
    await page.focus('#NumOfAdults');
    const numAdultInput = await page.$('#NumOfAdults');
    await numAdultInput?.type('2');
    await page.waitFor(100);

    // Click apply
    await page.click('#applyPassengersBtn');
    await page.waitFor(100);

    const [economyFares] = await page.$x('//label[@for="economyFares"]')
    await economyFares?.click();
    await page.waitFor(100);
}
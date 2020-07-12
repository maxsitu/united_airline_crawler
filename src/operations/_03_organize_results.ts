import {Page} from "puppeteer";

export async function organizeResults(page: Page) {
    await page.waitFor(Math.floor(Math.random() * 2000) + 1000 );
    await page.click('button[type="submit"]');
    try {
        await page.waitForSelector('input#newfilter\\_stop, #fl-search-nearbyerror-title', {timeout: 10000});
    } catch (e) {
        console.error('Error waiting for checkbox', e);
    }

    const nonStopCheckbox = await page.$('input#newfilter\\_nonStop');
    if (nonStopCheckbox) {
        const nonStopChecked: boolean = await (await nonStopCheckbox.getProperty('checked')).jsonValue() as boolean
        // Nonstop is not checked, need to check it.
        if (!nonStopChecked) {
            await page.click('input#newfilter\\_nonStop');
        }
    }

    const stopCheckbox = await page.$('input#newfilter\\_stop');
    if (stopCheckbox) {
        const stopChecked = await (await stopCheckbox.getProperty('checked')).jsonValue()
        // console.log('stopChecked', stopChecked);
        // with stops is checked, need to uncheck it.
        if (stopChecked) {
            // console.log('clicking with stops checkbox')
            await stopCheckbox.click();
        }
    }

    await page.waitFor(1000);
}
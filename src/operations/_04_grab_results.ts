import {Page} from "puppeteer";

export async function grabResults(page: Page) {
    // const notAvailableDiv = await page.$('#fl-results ul.flight-result-list');
    // if(!!notAvailableDiv) {
    //     return null;
    // }

    const businessPriceDivs = await page.$$('section#fl-results ul.flight-result-list li.flight-block-fares div.flight-block-fares-container div.fare-option.bg-business div.price-point');
    if (!!businessPriceDivs) {
        const prices: string[] = [];
        for (let div of businessPriceDivs) {
            const price: string = await (await div.getProperty('innerText')).jsonValue() as string;
            prices.push(price);
        }

        return prices
    }

    return null;
}
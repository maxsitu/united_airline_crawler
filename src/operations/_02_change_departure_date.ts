import {ElementHandle, Page} from "puppeteer";
import parseDate from 'date-fns/parse';
import formatDate from 'date-fns/format';

// function translateDate(dt: Date) {
//     return formatDate(dt, 'yyyy-MM-dd');
// }

// function translateMonth(dt: Date) {
//     return formatDate(dt, 'MMM');
// }

async function moveForward (page: Page) {
    const [fwd] = await page.$x("//button[contains(@aria-label, 'Move forward')]");
    await fwd.click();
    await page.waitFor(500);
}

async function moveBackward (page: Page) {
    const [bwd] = await page.$x("//button[contains(@aria-label, 'Move backward')]");
    await bwd.click();
    await page.waitFor(500);
}

async function getCalendarBlocks(page: Page) {
    return await page.$$("div.DayPicker_transitionContainer div.CalendarMonthGrid div:not(.CalendarMonthGrid_month__hidden) div.CalendarMonth:not([data-visible='false'])");
}

async function getMonth(calendarBlock: ElementHandle<Element>): Promise<string | null> {
    const caption = await calendarBlock.$('div.CalendarMonth_caption strong');
    if (caption) {
        return await (await caption.getProperty('textContent')).jsonValue() as string;
    }
    return null;
}

async function clickDate(calendarBlock: ElementHandle<Element>, date: Date) {
    const xpath = `//table[contains(@class, "CalendarMonth_table")]//td[contains(@aria-label, '${formatDate(date, 'MMMM d, yyyy')}') and contains(@class, "CalendarDay")]`;

    const [td] = await calendarBlock.$x(xpath);
    if(td) {
        // const tdHtml = await (await td.getProperty('innerHTML')).jsonValue();
        // console.log(`clicking ${tdHtml}`);
        await (td as any as ElementHandle<HTMLTableDataCellElement>).hover();
        await (td as any as ElementHandle<HTMLTableDataCellElement>).click();
    } else {
        console.error('td not valid');
        console.error(`xpath: ${xpath}`);
        const blockHtml = await (await calendarBlock.getProperty('innerHTML')).jsonValue();
        console.error(`calendarBlock: ${blockHtml}`)
    }
}

export async  function changeDepartureDate(page: Page, date: string) {
    const departDt = parseDate(date, 'yyyy-MM-dd', new Date());
    // console.debug(`Departure date: ${translateDate(departDt)}`);

    await page.click('input#DepartDate');
    await page.waitForSelector("div.DayPicker_transitionContainer div.CalendarMonthGrid div:not(.CalendarMonthGrid_month__hidden) div.CalendarMonth:not([data-visible='false'])");

    let direction: number = 0;
    while(true) {
        const blocks = await getCalendarBlocks(page);
        for (const b of blocks) {
            const m = await getMonth(b);
            // console.debug(`Month in calendar: ${m}`);
            if (!!m) {
                const currDt = parseDate(m, 'MMMM yyyy', new Date());
                // console.debug(`Curren year ${currDt.getFullYear()}`)
                if(currDt.getFullYear() > departDt.getFullYear()){
                    console.debug(`Look for year before ${currDt.getFullYear()}`)
                    direction = -1; // Backward
                    break;
                } else if(currDt.getFullYear() < departDt.getFullYear()){
                    // console.debug(`Look for year after ${currDt.getFullYear()}`)
                    direction = 1; // Forward
                } else {
                    if (currDt.getMonth() === departDt.getMonth()) {
                        // console.debug(`Find the correct month ${translateMonth(currDt)}`)
                        await clickDate(b, departDt);
                        // await page.waitFor(10000000);
                        return;
                    } else if (currDt.getMonth() > departDt.getMonth()) {
                        // console.debug(`Look for month before ${translateMonth(currDt)}`)
                        direction = -1; // Backward
                        break;
                    } else {
                        // console.debug(`Look for month after ${translateMonth(currDt)}`)
                        direction = 1; // Forward
                    }
                }
            } else {
                console.error('Failed to parse month in calendar');
            }
        }
        if (direction == -1) {
            // console.debug('Moving backward');
            await moveBackward(page);
        } else if (direction == 1) {
            // console.debug('Moving forward');
            await moveForward(page);
        }
    }
}
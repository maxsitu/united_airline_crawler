// import {mkdirSync, existsSync, writeFile} from 'fs';
import {mkdirSync, existsSync} from 'fs';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import {changeAirportsAndAdults} from "./operations/_01_change_adults";
import {changeDepartureDate} from "./operations/_02_change_departure_date";
import {organizeResults} from "./operations/_03_organize_results";
import {grabResults} from "./operations/_04_grab_results";
import startOfWeek from "date-fns/startOfWeek";
import addDays from 'date-fns/addDays';
import addWeeks from 'date-fns/addWeeks';
import format from 'date-fns/format';
import {sendNotification} from "./notifier";

const MIN_DATE_OFFSET = 14;
const LAST_DATE = new Date('2020-09-10');
// const LAST_DATE = new Date('2021-03-30');

function getOpDates(): string[] {
    let dates: Date[] = []
    const today: Date = new Date();
    let tempDate = addDays(today, MIN_DATE_OFFSET);

    [...Array(10).keys()].forEach((wks) => {
        const dayStartOfWeek = startOfWeek(addWeeks(tempDate, wks), { weekStartsOn: 0});
        const wed = addDays(dayStartOfWeek, 3);
        const sat = addDays(dayStartOfWeek, 6);

        if(wed > today && wed <= LAST_DATE) {
            dates.push(wed);
        }
        if(sat > today && sat <= LAST_DATE) {
            dates.push(sat);
        }
        tempDate = addWeeks(tempDate, 1);
    })
    return dates.map(date => format(date, 'yyyy-MM-dd'));
    // return ['2020-08-01'];
}

function buildMessage(departureDate: string, businessPrices: string[]) {
    return `Found flight at ${departureDate} with prices ${businessPrices.join(', ')}`;
}

export class Crawler {
    private baseUrl: string;
    private phoneNumber: string;

    constructor(baseUrl: string, phoneNumber: string) {
        this.baseUrl = baseUrl;
        this.phoneNumber = phoneNumber;
    }

    crawl(site: any) {
        const opDates = getOpDates();
        console.log('opDates', opDates);

        (async () => {
            const browser = await puppeteer.use(StealthPlugin()).launch({
                headless: false,
                ignoreHTTPSErrors: true,
                args: ['--disable-setuid-sandbox', '--no-sandbox', '--window-size=800,1080']
            });

            let flightDetected = false;
            for(let d of opDates) {
                const page = await browser.newPage()
                const isContinue = await this.crawlInternal(page, `${this.baseUrl}`, d, site["name"]);
                await page.close()
                if (!isContinue) {
                    flightDetected = true;
                    break;
                }
            }
            browser.close();

            // if (!flightDetected) {
            //     sendNotification(this.phoneNumber, 'Testing - No flight available found.');
            // }
        })();
    }

    /**
     * Crawling the site recursively
     * selectors is a list of selectors of child pages.
     */
    async crawlInternal(page: any, path: string, date: string, dirname: string) {
        if (!existsSync(dirname)) {
            mkdirSync(dirname);
        }

        const makeScreenshot = async (name) => {
            await page.screenshot({
                path: `${dirname}/${name}.png`,
                fullPage: true
            });
        }

        // const savePageContent = async (name) => {
        //     const content = await page.content();
        //     writeFile(`united/${name}.html`, content, err => {
        //         if (err) {
        //             console.error(`error: ${err}`)
        //         }
        //     })
        // }

        try {
            await page.goto(path, {
                timeout: 10000,
                waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2']
            });
        } catch (e) {
            console.error('Issue found loading page', e);
        }
        await changeAirportsAndAdults(page);

        await changeDepartureDate(page, date);
        await organizeResults(page);
        const businessPrices = await grabResults(page);

        await makeScreenshot(`${date}`);
        // await savePageContent(`${date}`);


        businessPrices?.forEach((businessPrice) => {
            console.log('businessPrice', businessPrice);
        })

        if (businessPrices && businessPrices.length > 0) {
            console.log(`sending sms to ${this.phoneNumber}`)
            await sendNotification(this.phoneNumber, buildMessage(date, businessPrices));
            return false;
        } else {
            return true;
        }
    }
}

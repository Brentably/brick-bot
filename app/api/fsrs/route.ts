import * as fsrs from 'ts-fsrs'
import type { Card } from 'ts-fsrs'

export async function POST(req: Request) {
    try {
        const rootWordToCardAndRating:Record<string, [Card, boolean]> = await req.json()

        const f = fsrs.fsrs()
        let updatedCards:Record<string, Card> = {}

        for (let word in rootWordToCardAndRating) {
            let card = rootWordToCardAndRating[word][0];
            let good = rootWordToCardAndRating[word][1];
            const scheduling_options = f.repeat(card, new Date())
            const rating = (good) ? fsrs.Rating.Good : fsrs.Rating.Again
            card = scheduling_options[rating].card
            updatedCards[word] = card
        }
        return new Response(JSON.stringify(updatedCards))

    } catch (e) {
        throw e;
    }
}
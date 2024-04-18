import * as fsrs from 'ts-fsrs'

export async function POST(req: Request) {
    try {
        const cardRatingPairs = await req.json()

        const f = fsrs.fsrs()
        let updatedCards = []

        for (let word in cardRatingPairs) {
            let card = cardRatingPairs[word][0];
            let clicked = cardRatingPairs[word][1];
            const scheduling_options = f.repeat(card, new Date())
            const rating = (clicked) ? fsrs.Rating.Again : fsrs.Rating.Good
            card = scheduling_options[rating].card
            updatedCards.push([word, card])
        }
        return new Response(JSON.stringify(updatedCards))

    } catch (e) {
        throw e;
    }
}
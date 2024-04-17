import * as fsrs from 'ts-fsrs'

export async function POST(req: Request) {
    try {
        const cardRatingPairs = await req.json()

        console.log(cardRatingPairs) 

        const f = fsrs.fsrs()
        let updatedCards = []

        for (let word in cardRatingPairs) {
            console.log("updating card data for token: " + word)
            let card = cardRatingPairs[word].card;
            let clicked = cardRatingPairs[word].clicked;
            const scheduling_options = f.repeat(card, new Date())
            const rating = (clicked) ? fsrs.Rating.Again : fsrs.Rating.Good
            card = scheduling_options[rating].card
            updatedCards.push([word, card])
        }

        console.log(updatedCards)
        return new Response(JSON.stringify(updatedCards))

    } catch (e) {
        throw e;
    }
}
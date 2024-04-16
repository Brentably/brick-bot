import * as fsrs from 'ts-fsrs'

export async function POST(req: Request) {
    try {
        const cardRatingPairs = await req.json()

        console.log(cardRatingPairs) 

        const f = fsrs.fsrs()
        let updatedCards = []

        for (let word in cardRatingPairs) {
            let card = cardRatingPairs[word].card;
            let ratingNum = cardRatingPairs[word].rating;
            const scheduling_options = f.repeat(card, new Date())
            if (ratingNum != 1 && ratingNum != 3) throw new Error("invalid rating")
            const rating = (ratingNum == 1) ? fsrs.Rating.Again : fsrs.Rating.Good
            card = scheduling_options[rating].card
            updatedCards.push([word, card])
        }

        console.log(updatedCards)
        return new Response(JSON.stringify(updatedCards))

    } catch (e) {
        throw e;
    }
}
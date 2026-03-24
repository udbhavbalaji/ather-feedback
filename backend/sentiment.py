import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

sia = SentimentIntensityAnalyzer()


def analyze_sentiment(text: str) -> dict:
    if not text or not text.strip():
        return {"polarity": 0.0, "label": "neutral"}

    scores = sia.polarity_scores(text)
    compound = scores["compound"]

    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    return {
        "polarity": compound,
        "label": label,
        "pos": scores["pos"],
        "neg": scores["neg"],
        "neu": scores["neu"],
    }


def download_vader():
    try:
        nltk.data.find("sentiment/vader_lexicon")
    except LookupError:
        print("Downloading VADER lexicon...")
        nltk.download("vader_lexicon", quiet=True)


if __name__ == "__main__":
    download_vader()

    test_texts = [
        "I love my Ather! Best scooter I've ever owned.",
        "The battery life is terrible and it keeps breaking down.",
        "The scooter is okay, nothing special.",
        "Amazing acceleration and great build quality. Highly recommend!",
    ]

    for text in test_texts:
        result = analyze_sentiment(text)
        print(f"Text: {text[:50]}...")
        print(f"Sentiment: {result}")
        print()

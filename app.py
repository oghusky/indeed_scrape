from flask import Flask, render_template, redirect, jsonify
from flask_cors import CORS
import scraper
app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def home():
    return render_template('index.html')


@app.route("/charts", methods=["GET"])
def charts():
    return render_template('charts.html')


@app.route("/keywords", methods=["GET"])
def keywords():
    return render_template('keywords.html')


@app.route("/jobs", methods=["GET"])
def jobs():
    return jsonify(data=scraper.render())


@app.route("/summaries", methods=["GET"])
def get_summaries():
    return jsonify(counts=scraper.summaries()[0],
                   cleaned_words=scraper.summaries()[1],
                   raw_words=scraper.summaries()[2],
                   useless=scraper.summaries()[3])


if __name__ == "__main__":
    app.run(debug=True)

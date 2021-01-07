import re
import os
import datetime
import collections
from flask import redirect
from splinter import Browser
from bs4 import BeautifulSoup
from pymongo import MongoClient

client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
db = client.jobs_db


def init_browser():
    # @NOTE: Replace the path with your actual path to the chromedriver
    executable_path = {"executable_path": "./chromedriver"}
    return Browser("chrome", **executable_path, headless=True)


def render():
    if (len(list(db.jobs_db.find())) > 0):
        return list(db.jobs_db.find())
    else:
        return scrape()


def scrape():
    job_data = []
    job_pages = []
    count = 0
    for page in range(0, 100, 10):
        # url = f"https://www.indeed.com/jobs?q=software+engineer+$85,000&l=Atlanta,+GA&rbl=Atlanta,+GA&jlid=966e6327a98f7e81&explvl=entry_level"
        url = f"https://www.indeed.com/jobs?q=data+engineer+%2485%2C000&l=Atlanta%2C+GA&rbl=Atlanta%2C+GA&jlid=966e6327a98f7e81&explvl=entry_level&start={page}"
        browser = init_browser()
        browser.visit(url)
        # time.sleep(2)
        page = browser.html
        soup = BeautifulSoup(page, 'html.parser')
        jobs = soup.findAll(
            "div", class_="jobsearch-SerpJobCard unifiedRow row result clickcard")
        for job in jobs:
            try:
                #     # title
                title = job.find("h2").text
            #     # company
                company = job.find("span", class_="company").text
            #     # salary
                salary = job.find(class_="salaryText")
                str_salary = str(salary)
            #     # summary
                summaries = job.find(class_="summary").ul.findAll("li")
                summary_items = []
                for summary in summaries:
                    summary_items.append(summary.text)
                db.jobs_db.insert_one({
                    "_id": str(count)+"_bloop_"+str(count),
                    "title": title.strip(),
                    "company": company.strip(),
                    "salary": str(salary),
                    "summaries": summary_items,
                    "expireAt": {
                        "default": datetime.datetime.now(),
                        "index": {
                            "expires": 60*60
                        }
                    }
                })
                count += 1
            except (AttributeError, TypeError) as e:
                pass
    return list(db.jobs_db.find())


def summaries():
    summaries = []
    removed = []
    useless = []
    # join summaries for each job into a string
    for summary in db.jobs_db.find():
        summaries.append(",".join(summary["summaries"]))
    joined = ",".join(summaries)
    split_up = joined.split(" ")
    bad_words = ["the", "to", "and", "a", "an", "for", "with",
                 "of", "as", "can", "on", "will", "well", "have",
                 "so", "feel", "that", "or", "in", "is", "all", "may",
                 "possible", "from", "this", "they", "we", "our", "your",
                 "mine", "ours", "you'll", "it", "you", "it's", "its", "other"]
    # does not remove words with commas and periods
    regex = re.compile('[@_!#$%^&*()<>?/\|}{~:]')
    for word in split_up:
        if word not in bad_words and not regex.search(word):
            removed.append(word.lower())
        else:
            useless.append(word.lower())
    occurences_dict = collections.Counter(removed)
    useless_dict = collections.Counter(useless)
    occurences_list = []
    useless_list = []
    for key in occurences_dict:
        occurences_list.append({
            "word": key,
            "count": occurences_dict[key]})
    for key in useless_dict:
        useless_list.append({
            "str_length": len(key),
            "count": useless_dict[key]
        })
    return occurences_list, removed, joined, useless_list

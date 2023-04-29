from flask import Flask, request
from flask_restful import Resource, Api
from flask_cors import CORS
from io import BytesIO
import pandas as pd
import json
from sqlalchemy import create_engine
from datetime import datetime

global engine
engine = create_engine('postgresql://danny:password@postgres:5432/postgres')

app = Flask(__name__)
CORS(app)
api = Api(app)

class Upload(Resource):
    def post(self):
        file = request.files['file']
        file_contents = file.read()

        # Load the contents of the buffer into a pandas dataframe
        df = pd.read_excel(BytesIO(file_contents))

        df.to_sql('mytable', engine, if_exists='replace')

        with engine.connect() as conn:
            result = conn.execute('SELECT * FROM mytable')
            return returnToJSON(result)


def returnToJSON(result):
    jsonStr = json.dumps([dict(row) for row in result], default=str)
    json_data = json.loads(jsonStr)
    return json_data

api.add_resource(Upload, '/upload')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
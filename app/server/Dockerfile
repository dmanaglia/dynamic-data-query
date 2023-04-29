FROM python:3.9

WORKDIR /app

COPY ./requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

ADD server.py .

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

CMD ["python", "-u", "server.py"]
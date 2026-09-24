import json


class JSONCustomEncoder(json.JSONEncoder):
    def default(self, obj):
        return obj.__dict__


class ApiError:
    def __init__(self, message: str, slug: str):
        self.message = message
        self.slug = slug

    def __iter__(self):
        yield from {
            "message": self.message,
            "slug": self.slug,
        }.items()

    def __str__(self):
        return json.dumps(self, cls=JSONCustomEncoder)

class Person:
    def __init__(self, name):
        self.name = name

def greet(self):
    print("Hi, I'm" + self.name)

minky = Person("Momo")
greet(minky) # Hi, I'm Momo
Person.greet = greet
minky.greet() # Hi, I'm Momo

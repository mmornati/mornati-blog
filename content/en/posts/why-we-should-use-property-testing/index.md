---
title: Why we should use Property testing?
categories:
- programming
tags:
- programming
- java
- development
- developer
- software-engineering
description: "Property-Based Testing (PBT) explained through a real Java example — how jqwik runs 1000 tests automatically, improves coverage, and makes your test suite more maintainable."
date: '2022-01-04T21:03:54.062000+00:00'
slug: why-we-should-use-property-testing
---

## Overview
When we talk about code quality, we always land on code coverage: we need to be sure to test all the code lines based on the provided inputs.

### What is the best code coverage?
We mostly talk about **80% code coverage**. That seems reasonable to have something good without losing a lot of time... but is that enough? How can we say we have "enough coverage" to be sure **we can put in production, without fear, just after each change**?

A good simple rule is:

>if we change something in the code: an `if` a loop, a value, variable init, ... a test should fail somewhere.

Because changing something in the code should modify how your application works: **same input, different output**.
What if the output doesn't change? Good question. Basically, never mind that code — we're still getting the expected result.

Now let's check the following function
```
@GetMapping
public ResponseEntity<List<Book>> getAllBooks(@RequestParam(required = false) String title) {
    try {
        List<Book> books = Optional.ofNullable(title)
               .filter(t -> !t.isEmpty())
               .map(bookRepository::findByTitleContaining)
               .orElseGet(bookRepository::findAll);
        if (books.isEmpty()) {
           return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }

        return new ResponseEntity<>(books, HttpStatus.OK);
    } catch (Exception e) {
        return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```
It will generate a JSON response containing the list of books retrieved from the DataBase. If we provide the `title` parameter, it retrieves books containing the given word(s). If the parameter is empty or null, it retrieves all books.
Then it will create a response based on the retrieved value.

What are the tests we should create to validate this simple code?
I'll try to list them here:
* with null title, check if the`findAll` method is invoked
* with an empty title, check if the`findAll` method is invoked
* with a valid title, check if `findByTitleContaining` with the title parameter
* if the `List<Book> books` is empty, the answer should be `HttpStatus.NO_CONTENT`
* if the `List<Book> books` is *not* empty, the answer should be `HttpStatus.OK` with the list of retrieved books
* if an error is created somewhere, the answer must be `HttpStatus.INTERNAL_SERVER_ERROR`

Going further, what about the values provided to `title`? Can it be any character, number, alphabet? How many tests do we have to write to be sure we have a *good code coverage*?

### Property Testing
The side problem with what we've just seen is code maintainability. Imagine we wrote *only* 6 tests (with a single possible title value!) if we change anything in the method, we might have to change all 6 tests. This means each change requires 6 times the effort compared to having no tests.

**But we have proper coverage**, and I can be confident that any other change won't break this code.

A simple solution can be to use **PBT**, Property-Based Test. We will write a single test that triggers hundred/thousand tests at once with the same code.
The following example is using the [jqwik](https://jqwik.net/) library:
```
@Property
public void testReadAllBooksEmpty(@WithNull @ForAll String title) {
    ResponseEntity<List<Book>> response = cut.getAllBooks(title);
    if (title != null && !title.isEmpty()) {
        verify(bookRepository).findByTitleContaining(title);
        verify(bookRepository, never()).findAll();
    } else {
        verify(bookRepository).findAll();
        verify(bookRepository, never()).findByTitleContaining(title);
    }
    assertEquals("Unexpected HTTP Status Code", response.getStatusCode(), HttpStatus.NO_CONTENT);
}
```
**NOTE**: as we have an `if` in the test, I know it should be 2 different tests instead. I just wanted to keep it extreme to show how simple it can be. I didn't want to be a Unit Test Purist 😅

The `@Property` annotation is specifying that the method is a PBT. Then the `@ForAll` annotation over a parameter is a way to say we want to inject different values for *all the tests* and the `@WithNull` is testing with a null `title`;
there are several other parameters and different ways to control how you want to manage the values injected into the `title` parameter.

With this basic configuration, it runs 1000 tests by default with **1000 different values** (including empty ones):
```
timestamp = 2021-12-31T17:40:22.380933, BookControllerTest:testReadAllBooks = 
                              |-------------------jqwik-------------------
tries = 1000                  | # of calls to property
checks = 1000                 | # of not rejected calls
generation = RANDOMIZED       | parameters are randomly generated
after-failure = PREVIOUS_SEED | use the previous seed
when-fixed-seed = ALLOW       | fixing the random seed is allowed
edge-cases#mode = MIXIN       | edge cases are mixed in
edge-cases#total = 3          | # of all combined edge cases
edge-cases#tried = 3          | # of edge cases tried in current run
seed = -8434577657060517927   | random seed to reproduce generated values
```
and we're validating that we're calling the correct `bookRepository` method based on the title parameter and the response is empty with `NO_CONTENT` status code.
We know it is always an empty response because the `bookRepository` is mocked and we didn't initialize it.

From the first list we wrote, with this single test method we tested:
* with null title check if the`findAll` method is invoked
* with an empty title check if the`findAll` method is invoked
* with a valid title check if `findByTitleContaining` with the title parameter
* if the `List<Book> books` is empty the answer should be `HttpStatus.NO_CONTENT`

We can then create a second one, for example, to test the information are correctly returned when the repository is giving valid book objects.

### Code changes
As we said at the beginning, good code coverage ensures changing stuff will fail tests.
For example:
```
List<Book> books = Optional.ofNullable(title)
                    //.filter(t -> !t.isEmpty())
                    .map(bookRepository::findByTitleContaining)
                    .orElseGet(bookRepository::findAll);
```
removing the empty filter, should cause a test to fail.
```
timestamp = 2021-12-31T17:57:31.304953, BookControllerTest:testReadAllBooksEmpty = 
  org.mockito.exceptions.verification.WantedButNotInvoked:
    Wanted but not invoked:
    bookRepository.findAll();
    -> at net.mornati.springnativepoc.controller.BookControllerTest.testReadAllBooksEmpty(BookControllerTest.java:36)
    However, there was exactly 1 interaction with this mock:
    bookRepository.findByTitleContaining("");
    -> at java.base/java.util.Optional.map(Optional.java:260)
```
🤩😎

But using PBT, we also get additional tests we didn't plan for. Imagine, for example, we want to filter titles longer than 10 characters. Code can be something like
```
List<Book> books = Optional.ofNullable(title)
                    .filter(t -> !t.isEmpty())
                    .filter(t -> t.length() <= 10)
                    .map(bookRepository::findByTitleContaining)
                    .orElseGet(bookRepository::findAll);
```
Since the 1000 automatic tests include many different titles of different lengths, running the test without any changes will show the code isn't working as expected
```
 org.mockito.exceptions.verification.WantedButNotInvoked:
    Wanted but not invoked:
    bookRepository.findByTitleContaining(
        "        "
    );
    -> at net.mornati.springnativepoc.controller.BookControllerTest.testReadAllBooksEmpty(BookControllerTest.java:33)
    However, there was exactly 1 interaction with this mock:
    bookRepository.findAll();
    -> at java.base/java.util.Optional.orElseGet(Optional.java:364)
```
we are calling the `findAll` method instead of the `findByTitleContaining`.

With manual tests, this case could also be covered **by chance**: we have to use a title longer than 10 chars within our test. So we automatically get better coverage without changing everything, and as I said, better maintainability.

### Conclusion
I tried to show you how powerful PBT can be and why we should use them. It's certainly a very simple example. In real life, PBT is much more complex: multiple parameters, custom objects... the jqwik framework I used supports all of these.
How do you know whether to write a PBT instead of a simple unit test? Basically, any time you're calling a method with "static" parameters, you should write a property-based or parameterized test instead.
```
var result = myMethod("xxx");

var result2 = myMethod2(2, new Car("Peugeot"));
```
In my opinion, these are tests you should try to rewrite for better and automatic code coverage.
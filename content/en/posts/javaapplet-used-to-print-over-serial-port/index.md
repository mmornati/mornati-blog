---
title: 'Java Applet used to print over Serial Port'
date: '2009-02-09T23:00:00+00:00'
slug: javaapplet-used-to-print-over-serial-port
categories:
  - development
  - java
tags:
  - java
  - applet
  - serial-port
  - printing
  - barcode
  - rxtx
  - javax.comm
description: Learn how to use Java applets for serial port printing from web applications, including RXTX library setup, applet code, and JavaScript integration for barcode printing.
---

What I want to share with you today is a way to print on a serial printer (in my case I used a barcode printer).

Anyone starting to read this post could think: *"Yes but is not too difficult to use serial port with Java"*. Yes, but you have to think about another point: we are talking about a web application, and our printer is linked to the client (naturally... maybe my server is **not** directly accessible). And another interesting point is that our installed JRE **could block** access to computer ports. I say "could" but it surely does if you haven't set the "policy" file or added the necessary library to the JRE.

Anyway... here is my experience.

## Starting Point

The starting point was *locate the necessary libraries*, and after some tests with the official Sun [javax.comm](https://www.oracle.com/java/technologies/) library, I decided to use the [RXTX](http://rxtx.qbang.org/wiki) library because it provides everything necessary to use serial ports on all operating systems.

And now... all is very simple to do.

## Applet

As I said before, we need "something" printed on the client machine. So we surely need a simple applet, maybe hidden.

Inside the **init** method you just need to initialize your ports.

```java
@Override
public void init() {
    try {
        Enumeration portList = CommPortIdentifier.getPortIdentifiers();

        if (portList.hasMoreElements()) {
            this.portId = ((CommPortIdentifier) portList.nextElement());
        }
    } catch (Exception e) {
        e.printStackTrace();
    }

    // Opening port to test
    try {
        CommPort serialPort = this.portId.open("SerialPort", 200);
        serialPort.close();
    } catch (Exception ex) {
        ex.printStackTrace();
    }
}
```

The second part of this code, *Opening port to test*, is **necessary** to let your applet always be ready to print. During my tests, if I didn't try to open the serial port after getting it, sometimes it did not work.

After this, what you need is a simple method to print what you need. I post here my code that, as I said, is used to print a barcode.

```java
public void printBarCode(String code) {
    try {
        CommPort serialPort = this.portId.open("SerialPort", 200);

        PrintStream out = new PrintStream(serialPort.getOutputStream(), true);
        out.println("N\n");
        out.println("D13\n");
        out.println("S2\n");
        out.println("B240,2,0,K,4,5,83,B,\"" + code + "\"\n");
        out.println("P1\n");

        out.close();

        serialPort.close();
    } catch (Exception ex) {
        ex.printStackTrace();
    }
}
```

All information I'm sending to print was obtained from the EPL printer manual. These are just the commands you need to set up the printer, page, and barcode style.

If you need anything special, you can consider your applet *ready to use*. You may just package it in a JAR and add the JAR to your web server or web application.

## Adding Applet to a Page

Inside your page you can just add the applet using the `<applet>` tag or `<object>` tag. In my case I used the applet tag because the object tag gave me some problems. In all tests I've done with the applet tag, it works correctly on both IE and Firefox with Windows and Linux.

```html
<applet name="barcodeprinter"
        id="barcodeprinter"
        archive="/BarCodeApplet.jar"
        code="com.bytecode.priterapplet.BarCodePrinter"
        MAYSCRIPT="true"
        style="width: 1px; height: 1px; background: white;">
</applet>
```

**Note** the `mayscript` parameter. It is used to let your browser (JavaScript) interact with your applet. In fact, if you don't add it, what you can do is just load a page with an applet that starts printing a "static text". Not so useful!

More interesting is letting the user select the "code" to print. And you can do this with a **very simple** JavaScript code.

```javascript
<script type="text/javascript">
    function inventario(code) {
        var applet = document.getElementById("barcodeprinter");
        if(code != '') {
            applet.printBarCode(code);
        }
    }
</script>
```

And to call your JavaScript:

```html
<a href="#" onclick="inventario('selectedCode');">Selected Element</a>
```

## Configuring Client

If you try to use your applet without configuring your JRE, you couldn't print anything. What you need is to get the *RXTXcomm.jar* file and copy it to the *JRE_HOME/lib/ext* folder, and the correct library (DLL for Windows, .so for Linux) and copy it to the *JRE_HOME/bin* folder. For Mac, the procedure is a little bit different, but you can find the instructions for all operating systems directly on the RXTX website.

## Enhancements

What I tried after this was the dynamic configuration of the client. What you can do is copy the DLL/SO file in a client folder, load it dynamically into the JRE, but anyway, you have to set, at least, the .policy file on the client. This is a security setting in Java: from a web applet you can't do what you want on a client computer.

Anyway, here is a little example of what I've done:

```java
if (System.getProperty("os.name").toUpperCase().contains("WINDOWS")) {
    libraryName = DLL_SERIAL_NAME;
    libraryFile = System.getProperty("java.io.tmpdir") + DLL_SERIAL_NAME;
} else if (System.getProperty("os.name").toUpperCase().contains("LINUX")) {
    if (System.getProperty("os.arch").contains("i386")) {
        libraryName = SO_SERIAL_NAME_32;
    } else {
        libraryName = SO_SERIAL_NAME_64;
    }

    char fileSeparator = System.getProperty("file.separator").charAt(0);
    libraryFile = System.getProperty("java.io.tmpdir") + fileSeparator + SO_SERIAL_NAME;
}

if (!(verifyLibraryExistence(libraryFile))) {
    copyResourceFromJar(libraryFile, libraryName);
}
try {
    System.load(libraryFile);
} catch (Exception e) {
    e.printStackTrace();
}
```

DLL and .so files are contained in the applet JAR.

Hope this is useful to someone. Write to me if you have any kind of problem!

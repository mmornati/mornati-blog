---
title: 'Spring MVC: Database MessageSource fall back to properties file'
categories:
- programming
- web-dev-blogging
date: '2013-06-13T22:00:00+00:00'
slug: spring-mvc-database-messagesource-fall-back-to-properties-file
tags:
  - spring
  - spring-mvc
  - i18n
  - messagesource
  - java
  - localization
description: >-
  How to implement a database-driven MessageSource in Spring MVC with fallback
  to properties files, allowing users to update translations at runtime without
  redeployment.
---

## Overview

For a highly dynamic application, I needed to allow users (admin users) to update some translation messages without having to redeploy application any time (for example, some messages about operations to accomplish that change almost any week).
To allow this with the framework I'm using (Spring MVC) I decided to change the message resource strategy, adding a database-driven source with priority to the "standard" properties file messages.

## Configuration

In your application context (i.e. root-context.xml) you have to configure the two message resource beans:

```xml
<bean id="propertiesMessageSource" class="org.springframework.context.support.ReloadableResourceBundleMessageSource">
        <property name="basename" value="/WEB-INF/messages/messages"/>
        <property name="defaultEncoding" value="UTF-8"/>
        <property name="cacheSeconds" value="0"/>
        <property name="fallbackToSystemLocale" value="false"/>
    </bean>

    <bean id="messageSource" class="net.mornati.DatabaseDrivenMessageSource">
        <constructor-arg ref="messageResourceService"/>
        <property name="parentMessageSource" ref="propertiesMessageSource"/>
    </bean>
```

The *propertiesMessageSource* is the one using the properties file with translated message, the *messageSource* (the one used by default for the Spring MVC framework) just inject the service to load messages from database and set the propertiesMessageSource as a parent (the fallback message source).

## DatabaseDrivenMessageSource

```java
package net.mornati.configuration;

import net.mornati.model.MessageResource;
import net.mornati.service.MessageResourceService;
import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ResourceLoaderAware;
import org.springframework.context.support.AbstractMessageSource;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.ResourceLoader;

import java.text.MessageFormat;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class DatabaseDrivenMessageSource extends AbstractMessageSource implements ResourceLoaderAware {

    private Logger log = Logger.getLogger(getClass());
    private ResourceLoader resourceLoader;

    private final Map<String, Map<String, String>> properties = new HashMap<String, Map<String, String>>();

    @Autowired
    private MessageResourceService messageResourceService;

    public DatabaseDrivenMessageSource() {
        reload();
    }

    public DatabaseDrivenMessageSource(MessageResourceService messageResourceService) {
        this.messageResourceService = messageResourceService;
        reload();
    }

    @Override
    protected MessageFormat resolveCode(String code, Locale locale) {
        String msg = getText(code, locale);
        MessageFormat result = createMessageFormat(msg, locale);
        return result;
    }

    @Override
    protected String resolveCodeWithoutArguments(String code, Locale locale) {
        return getText(code, locale);
    }

    private String getText(String code, Locale locale) {
        Map<String, String> localized = properties.get(code);
        String textForCurrentLanguage = null;
        if (localized != null) {
            textForCurrentLanguage = localized.get(locale.getLanguage());
            if (textForCurrentLanguage == null) {
                textForCurrentLanguage = localized.get(Locale.FRANCE.getLanguage());
            }
        }
        if (textForCurrentLanguage==null) {
            //Check parent message
            logger.debug("Fallback to properties message");
            try {
                textForCurrentLanguage = getParentMessageSource().getMessage(code, null, locale);
            } catch (Exception e) {
                logger.error("Cannot find message with code: " + code);
            }
        }
        return textForCurrentLanguage != null ? textForCurrentLanguage : code;
    }

    public void reload() {
        properties.clear();
        properties.putAll(loadTexts());
    }

    protected Map<String, Map<String, String>> loadTexts() {
        log.debug("loadTexts");
        Map<String, Map<String, String>> m = new HashMap<String, Map<String, String>>();
        List<MessageResource> texts = messageResourceService.loadAllMessages();
        for (MessageResource text : texts) {
            Map<String, String> v = new HashMap<String, String>();
            v.put("en", text.getEnglish());
            v.put("de", text.getGerman());
            v.put("fr", text.getFrench());
            v.put("en_US", text.getAmerican());
            m.put(text.getMessageKey(), v);
        }
        return m;
    }

    @Override
    public void setResourceLoader(ResourceLoader resourceLoader) {
        this.resourceLoader = (resourceLoader != null ? resourceLoader : new DefaultResourceLoader());
    }
}
```

In this class you will load all messages from database during the class instantiation (with the *reload* method) and then you can simply access your cached messages.

## Reloading Messages

If user changes/adds messages to database with the application started, you can invoke the reload method, with something like this:

```java
private void reloadDatabaseMessages() {
        //Reload Messages
        if (messageSource instanceof DatabaseDrivenMessageSource) {
            ((DatabaseDrivenMessageSource)messageSource).reload();
        } else if (messageSource instanceof DelegatingMessageSource) {
            DelegatingMessageSource myMessage = ((DelegatingMessageSource)messageSource);
            if (myMessage.getParentMessageSource()!=null && myMessage.getParentMessageSource() instanceof DatabaseDrivenMessageSource) {
                ((DatabaseDrivenMessageSource) myMessage.getParentMessageSource()).reload();
            }
        }
    }
```

## Message Model

In the end, you can configure your database model as you prefer (depends about the information you need to store). In my example I created a simple class with the message code (the same you have in the properties files) and messages for any supported language.

```java
package net.mornati.model;

import org.hibernate.envers.Audited;
import org.hibernate.envers.RelationTargetAuditMode;

import javax.persistence.*;
import java.io.Serializable;

/**
 * MessageResource for DatabaseDriven Messages
 */
@Entity
@Table(name = "message_resource")
@Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
public class MessageResource implements Serializable {

    private Long id;
    private String messageKey;
    private String french;
    private String english;
    private String german;
    private String american;

    public MessageResource() {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @Column(name = "messageKey", nullable = false)
    public String getMessageKey() {
        return messageKey;
    }

    public void setMessageKey(String messageKey) {
        this.messageKey = messageKey;
    }

    @Column(name = "fr", nullable = true)
    public String getFrench() {
        return french;
    }

    public void setFrench(String french) {
        this.french = french;
    }

    @Column(name = "en", nullable = true)
    public String getEnglish() {
        return english;
    }

    public void setEnglish(String english) {
        this.english = english;
    }

    @Column(name = "de", nullable = true)
    public String getGerman() {
        return german;
    }

    public void setGerman(String german) {
        this.german = german;
    }

    @Column(name = "us", nullable = true)
    public String getAmerican() {
        return american;
    }

    public void setAmerican(String american) {
        this.american = american;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        MessageResource that = (MessageResource) o;

        if (messageKey != null ? !messageKey.equals(that.messageKey) : that.messageKey != null) return false;

        return true;
    }

    @Override
    public int hashCode() {
        return messageKey != null ? messageKey.hashCode() : 0;
    }
}
```

That's all. You should have now an application that will try to load messages using the database message resource (not executing a query anytime, but reading the cached messages) and if message is not found in db it will try to look for it into property file. In this way you can create a page that allow you to override messages without restarting the application/web server.
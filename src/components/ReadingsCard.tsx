import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DailyReadingOutput } from '../services/daily-reading-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './Accordion';

interface ReadingsCardProps {
  readings: DailyReadingOutput;
}

interface ReadingItemProps {
  value: string;
  title: string;
  reference: string;
  text: string;
}

export function ReadingsCard({ readings }: ReadingsCardProps) {
  const feastParts = readings.feast.split(' or ');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle icon={<Icon name="menu-book" size={24} color="#ffffff" />}>
          Today's Readings
        </CardTitle>
        <CardDescription>
          <View>
            <Text style={styles.feastTitle}>{feastParts[0]}</Text>
            {feastParts.length > 1 && (
              <Text style={styles.feastSubtitle}>or {feastParts[1]}</Text>
            )}
            <Text style={styles.date}>{readings.date}</Text>
          </View>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion defaultValue="item-1">
          <ReadingItem 
            value="item-1" 
            title="First Reading" 
            reference={readings.firstReading.reference} 
            text={readings.firstReading.text} 
          />
          <ReadingItem 
            value="item-2" 
            title="Responsorial Psalm" 
            reference={readings.responsorialPsalm.reference} 
            text={readings.responsorialPsalm.text} 
          />
          <ReadingItem 
            value="item-3" 
            title="Gospel" 
            reference={readings.gospel.reference} 
            text={readings.gospel.text} 
          />
        </Accordion>
      </CardContent>
    </Card>
  );
}

function ReadingItem({ value, title, reference, text }: ReadingItemProps) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>
        <View>
          <Text style={styles.readingTitle}>{title}</Text>
          <Text style={styles.reference}>{reference}</Text>
        </View>
      </AccordionTrigger>
      <AccordionContent>
        <Text style={styles.readingText}>{text}</Text>
      </AccordionContent>
    </AccordionItem>
  );
}

const styles = StyleSheet.create({
  feastTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  feastSubtitle: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#94a3b8',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#94a3b8',
  },
  readingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  reference: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  readingText: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 24,
  },
});
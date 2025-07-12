import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Collapsible from 'react-native-collapsible';

interface AccordionProps {
  children: React.ReactNode;
  defaultValue?: string;
}

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  onPress: () => void;
  isOpen: boolean;
}

interface AccordionContentProps {
  children: React.ReactNode;
  isOpen: boolean;
}

export function Accordion({ children, defaultValue }: AccordionProps) {
  const [openItem, setOpenItem] = useState<string | null>(defaultValue || null);

  const toggleItem = (value: string) => {
    setOpenItem(openItem === value ? null : value);
  };

  return (
    <View style={styles.accordion}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            isOpen: openItem === child.props.value,
            onToggle: () => toggleItem(child.props.value),
          });
        }
        return child;
      })}
    </View>
  );
}

export function AccordionItem({ value, children, isOpen, onToggle }: AccordionItemProps & { isOpen?: boolean; onToggle?: () => void }) {
  return (
    <View style={styles.item}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === AccordionTrigger) {
            return React.cloneElement(child, {
              ...child.props,
              onPress: onToggle,
              isOpen,
            });
          }
          if (child.type === AccordionContent) {
            return React.cloneElement(child, {
              ...child.props,
              isOpen,
            });
          }
        }
        return child;
      })}
    </View>
  );
}

export function AccordionTrigger({ children, onPress, isOpen }: AccordionTriggerProps) {
  return (
    <TouchableOpacity style={styles.trigger} onPress={onPress}>
      <View style={styles.triggerContent}>
        {children}
        <Icon 
          name="keyboard-arrow-down" 
          size={20} 
          color="#94a3b8" 
          style={[styles.chevron, isOpen && styles.chevronOpen]}
        />
      </View>
    </TouchableOpacity>
  );
}

export function AccordionContent({ children, isOpen }: AccordionContentProps) {
  return (
    <Collapsible collapsed={!isOpen}>
      <View style={styles.content}>
        {children}
      </View>
    </Collapsible>
  );
}

const styles = StyleSheet.create({
  accordion: {
    // Container styles
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  trigger: {
    paddingVertical: 16,
  },
  triggerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  content: {
    paddingBottom: 16,
  },
});
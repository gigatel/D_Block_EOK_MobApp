import React from 'react';
import { View } from 'react-native';
import { Card, Divider, Text } from '@/components';
import { useTheme } from '@/theme';

/** Titled card grouping list rows with hairline separators. */
export function Section({
  title,
  children,
  footer,
}: {
  title?: string;
  children: React.ReactNode;
  footer?: string;
}) {
  const theme = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {title ? (
        <Text
          variant="overline"
          color="muted"
          accessibilityRole="header"
          style={{ paddingHorizontal: theme.spacing.xs }}
        >
          {title}
        </Text>
      ) : null}
      <Card
        padding="none"
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.xs,
        }}
      >
        {items.map((child, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <Divider inset={52} /> : null}
            {child}
          </React.Fragment>
        ))}
      </Card>
      {footer ? (
        <Text
          variant="caption"
          color="muted"
          style={{ paddingHorizontal: theme.spacing.xs }}
        >
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

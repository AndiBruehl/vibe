import { useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";

export default function PostImages({ image, images, description }: { image: string; images?: string[]; description: string }) {
  const items = images?.length ? images.slice(0, 4) : [image];
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const scroll = useRef<ScrollView>(null);
  return (
    <View style={styles.frame} onLayout={event => {
      const next = event.nativeEvent.layout.width;
      setWidth(next);
      scroll.current?.scrollTo({ x: index * next, animated: false });
    }}>
      {width > 0 ? <ScrollView ref={scroll} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={event => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}>
        {items.map((uri, position) => <Image key={`${position}-${uri}`} source={{ uri }}
          accessibilityLabel={`${description || "Post image"}, ${position + 1} of ${items.length}`}
          resizeMode="contain" style={{ width, height: width }} />)}
      </ScrollView> : null}
      {items.length > 1 ? <View pointerEvents="none" style={styles.counter}>
        <Text style={styles.label}>{index + 1} / {items.length}</Text>
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: "100%", aspectRatio: 1, backgroundColor: colors.cardElevated },
  counter: { position: "absolute", top: 12, right: 12, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.background },
  label: { color: colors.text, fontSize: 12, fontWeight: "700" },
});

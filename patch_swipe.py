import re

with open("src/components/YLSeragamView.tsx", "r") as f:
    content = f.read()

swipe_state = """
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };
"""

content = content.replace("  const isToday = currentDate.toDateString() === new Date().toDateString();", swipe_state + "\n  const isToday = currentDate.toDateString() === new Date().toDateString();")
content = content.replace('<div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col">', '<div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>')

with open("src/components/YLSeragamView.tsx", "w") as f:
    f.write(content)

(self as any).oldAddEventListener = self.addEventListener;
self.addEventListener = null;

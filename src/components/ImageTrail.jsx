import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

import './ImageTrail.css';

function lerp(a, b, n) {
  return (1 - n) * a + n * b;
}

function getLocalPointerPos(e, rect) {
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function getMouseDistance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}

class ImageItem {
  constructor(DOM_el) {
    this.DOM = { el: DOM_el, inner: DOM_el.querySelector('.content__img-inner') };
    this.defaultStyle = { scale: 1, x: 0, y: 0, opacity: 0 };
    this.rect = null;
    this.resize = this.resize.bind(this);

    this.getRect();
    window.addEventListener('resize', this.resize);
  }

  resize() {
    gsap.set(this.DOM.el, this.defaultStyle);
    this.getRect();
  }

  getRect() {
    this.rect = this.DOM.el.getBoundingClientRect();
  }

  destroy() {
    window.removeEventListener('resize', this.resize);
  }
}

class ImageTrailBase {
  constructor(container) {
    this.container = container;
    this.DOM = { el: container };
    this.images = [...container.querySelectorAll('.content__img')].map(img => new ImageItem(img));
    this.imagesTotal = this.images.length;
    this.imgPosition = 0;
    this.zIndexVal = 1;
    this.activeImagesCount = 0;
    this.isIdle = true;
    this.threshold = window.matchMedia('(pointer: coarse)').matches ? 16 : 80;
    this.rafId = null;

    this.mousePos = { x: 0, y: 0 };
    this.lastMousePos = { x: 0, y: 0 };
    this.cacheMousePos = { x: 0, y: 0 };

    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.render = this.render.bind(this);

    this.container.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    this.container.addEventListener('pointermove', this.handlePointerMove, { passive: false });

    this.rafId = requestAnimationFrame(this.render);
  }

  handlePointerDown(ev) {
    if (ev.cancelable) {
      ev.preventDefault();
    }

    const rect = this.container.getBoundingClientRect();
    const pointerPos = getLocalPointerPos(ev, rect);
    this.mousePos = pointerPos;
    this.lastMousePos = pointerPos;
    this.cacheMousePos = pointerPos;

    this.showNextImage();
  }

  handlePointerMove(ev) {
    if (ev.cancelable && ev.pointerType === 'touch') {
      ev.preventDefault();
    }

    const rect = this.container.getBoundingClientRect();
    this.mousePos = getLocalPointerPos(ev, rect);
  }

  render() {
    const distance = getMouseDistance(this.mousePos, this.lastMousePos);
    this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.1);
    this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.1);

    if (distance > this.threshold) {
      this.showNextImage();
      this.lastMousePos = { ...this.mousePos };
    }

    if (this.isIdle && this.zIndexVal !== 1) {
      this.zIndexVal = 1;
    }

    this.rafId = requestAnimationFrame(this.render);
  }

  onImageActivated() {
    this.activeImagesCount += 1;
    this.isIdle = false;
  }

  onImageDeactivated() {
    this.activeImagesCount -= 1;
    if (this.activeImagesCount === 0) {
      this.isIdle = true;
    }
  }

  getNextImage() {
    this.zIndexVal += 1;
    this.imgPosition = this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
    return this.images[this.imgPosition];
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.container.removeEventListener('pointerdown', this.handlePointerDown);
    this.container.removeEventListener('pointermove', this.handlePointerMove);
    this.images.forEach(img => img.destroy());
  }
}

class ImageTrailVariant1 extends ImageTrailBase {
  showNextImage() {
    const img = this.getNextImage();
    if (!img) return;

    gsap.killTweensOf(img.DOM.el);
    gsap
      .timeline({
        onStart: () => this.onImageActivated(),
        onComplete: () => this.onImageDeactivated()
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          scale: 1,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - img.rect.width / 2,
          y: this.cacheMousePos.y - img.rect.height / 2
        },
        {
          duration: 0.4,
          ease: 'power1',
          x: this.mousePos.x - img.rect.width / 2,
          y: this.mousePos.y - img.rect.height / 2
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: 'power3',
          opacity: 0,
          scale: 0.2
        },
        0.4
      );
  }
}

class ImageTrailVariant2 extends ImageTrailBase {
  showNextImage() {
    const img = this.getNextImage();
    if (!img) return;

    gsap.killTweensOf(img.DOM.el);
    gsap
      .timeline({
        onStart: () => this.onImageActivated(),
        onComplete: () => this.onImageDeactivated()
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          scale: 0,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - img.rect.width / 2,
          y: this.cacheMousePos.y - img.rect.height / 2
        },
        {
          duration: 0.4,
          ease: 'power1',
          scale: 1,
          x: this.mousePos.x - img.rect.width / 2,
          y: this.mousePos.y - img.rect.height / 2
        },
        0
      )
      .fromTo(
        img.DOM.inner,
        {
          scale: 2.8,
          filter: 'brightness(250%)'
        },
        {
          duration: 0.4,
          ease: 'power1',
          scale: 1,
          filter: 'brightness(100%)'
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: 'power2',
          opacity: 0,
          scale: 0.2
        },
        0.45
      );
  }
}

const variantMap = {
  1: ImageTrailVariant1,
  2: ImageTrailVariant2,
  3: ImageTrailVariant2,
  4: ImageTrailVariant2,
  5: ImageTrailVariant2,
  6: ImageTrailVariant2,
  7: ImageTrailVariant2,
  8: ImageTrailVariant2
};

export default function ImageTrail({ items = [], variant = 1 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || items.length === 0) return undefined;

    const Cls = variantMap[variant] || variantMap[1];
    const instance = new Cls(containerRef.current);

    return () => {
      instance.destroy();
    };
  }, [variant, items]);

  return (
    <div className="content" ref={containerRef}>
      {items.map((url, i) => (
        <div className="content__img" key={i}>
          <div className="content__img-inner" style={{ backgroundImage: `url(${url})` }} />
        </div>
      ))}
    </div>
  );
}

class FinsweetSliderGenerator {
    constructor() {
        this.currentTab = 'list-slider';
        this.currentOutput = 'html';
        this.init();
    }

    init() {
        this.bindEvents();
        this.generateCode();
        this.updatePreview();
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Output tab switching
        document.querySelectorAll('.output-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchOutputTab(e.target.dataset.output);
            });
        });

        // Form input changes
        document.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => {
                this.generateCode();
                this.updatePreview();
            });
        });

        // Data source change
        document.getElementById('data-source').addEventListener('change', (e) => {
            this.toggleCMSFields(e.target.value === 'cms');
        });

        // Copy buttons
        document.getElementById('copy-html').addEventListener('click', () => {
            this.copyToClipboard('html');
        });

        document.getElementById('copy-script').addEventListener('click', () => {
            this.copyToClipboard('script');
        });

        document.getElementById('copy-css').addEventListener('click', () => {
            this.copyToClipboard('css');
        });

        document.getElementById('copy-all').addEventListener('click', () => {
            this.copyToClipboard('all');
        });
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab panel
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
        this.generateCode();
        this.updatePreview();
    }

    switchOutputTab(outputType) {
        // Update active output tab
        document.querySelectorAll('.output-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-output="${outputType}"]`).classList.add('active');

        // Update active output panel
        document.querySelectorAll('.output-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${outputType}-output`).classList.add('active');

        this.currentOutput = outputType;
    }

    toggleCMSFields(show) {
        const cmsFields = document.querySelectorAll('.cms-only');
        cmsFields.forEach(field => {
            field.style.display = show ? 'flex' : 'none';
        });
    }

    generateCode() {
        const generators = {
            'list-slider': this.generateListSliderCode.bind(this),
            'range-slider': this.generateRangeSliderCode.bind(this),
            'custom-dots': this.generateCustomDotsCode.bind(this)
        };

        const result = generators[this.currentTab]();
        
        document.getElementById('html-code').textContent = result.html;
        document.getElementById('script-code').textContent = result.script;
        document.getElementById('css-code').textContent = result.css;
    }

    generateListSliderCode() {
        const config = this.getListSliderConfig();
        
        const html = this.generateListSliderHTML(config);
        const script = this.generateFinsweetScript(['fs-list']);
        const css = this.generateBasicSliderCSS(config.sliderName);

        return { html, script, css };
    }

    generateRangeSliderCode() {
        const config = this.getRangeSliderConfig();
        
        const html = this.generateRangeSliderHTML(config);
        const script = this.generateFinsweetScript(['fs-rangeslider']);
        const css = this.generateRangeSliderCSS(config.sliderName);

        return { html, script, css };
    }

    generateCustomDotsCode() {
        const config = this.getCustomDotsConfig();
        
        const html = this.generateCustomDotsHTML(config);
        const script = this.generateFinsweetScript(['fs-sliderdots']);
        const css = this.generateCustomDotsCSS(config.sliderName);

        return { html, script, css };
    }

    getListSliderConfig() {
        return {
            sliderName: document.getElementById('slider-name').value || 'my-slider',
            dataSource: document.getElementById('data-source').value,
            collectionName: document.getElementById('collection-name').value || 'blog-posts',
            itemsPerSlide: parseInt(document.getElementById('items-per-slide').value) || 1,
            autoPlay: document.getElementById('auto-play').checked,
            infiniteScroll: document.getElementById('infinite-scroll').checked,
            resetInteractions: document.getElementById('reset-interactions').checked,
            instanceName: document.getElementById('instance-name').value
        };
    }

    getRangeSliderConfig() {
        return {
            sliderName: document.getElementById('range-name').value || 'price-range',
            minValue: parseInt(document.getElementById('min-value').value) || 0,
            maxValue: parseInt(document.getElementById('max-value').value) || 100,
            stepValue: parseFloat(document.getElementById('step-value').value) || 1,
            startValue: parseInt(document.getElementById('start-value').value) || 50,
            handles: parseInt(document.getElementById('handles').value) || 1,
            formatDisplay: document.getElementById('format-display').checked,
            updateMode: document.getElementById('update-mode').value || 'move'
        };
    }

    getCustomDotsConfig() {
        return {
            sliderName: document.getElementById('dots-slider-name').value || 'main-slider',
            dotContent: document.getElementById('dot-content').value || 'text',
            activeClass: document.getElementById('active-class').value || 'is-active',
            removeOriginal: document.getElementById('remove-original').checked,
            clearNav: document.getElementById('clear-nav').checked
        };
    }

    generateListSliderHTML(config) {
        const instanceAttr = config.instanceName ? ` fs-list-instance="${config.instanceName}"` : '';
        const resetInteractionAttr = config.resetInteractions ? ` fs-list-resetix="true"` : '';

        if (config.dataSource === 'cms') {
            return `<!-- Finsweet List Slider Setup -->
<!-- Hidden CMS Collection List (Data Source) -->
<div class="${config.collectionName}-list" fs-list-element="list"${instanceAttr}>
  <div class="collection-list w-dyn-list">
    <div role="list" class="collection-list-wrapper w-dyn-items">
      <div role="listitem" class="collection-item w-dyn-item">
        <!-- Your CMS content goes here -->
        <h3 class="item-title">Collection Item Title</h3>
        <p class="item-description">Collection item description...</p>
        <img src="https://via.placeholder.com/300x200" alt="Collection Image" class="item-image">
      </div>
    </div>
  </div>
</div>

<!-- Visible Slider Component -->
<div class="${config.sliderName}" fs-list-element="slider"${resetInteractionAttr}${instanceAttr}>
  <div class="slider w-slider">
    <div class="slider-mask w-slider-mask">
      <div class="slide w-slide">
        <!-- Slide content will be populated by Finsweet -->
      </div>
      <div class="slide w-slide">
        <!-- Slide content will be populated by Finsweet -->
      </div>
    </div>
    <div class="slider-arrow-left w-slider-arrow-left">
      <div class="arrow-icon">‹</div>
    </div>
    <div class="slider-arrow-right w-slider-arrow-right">
      <div class="arrow-icon">›</div>
    </div>
    <div class="slider-nav w-slider-nav w-round"></div>
  </div>
</div>`;
        } else {
            return `<!-- Finsweet List Slider Setup (Static Content) -->
<!-- Static List (Data Source) -->
<div class="${config.sliderName}-list" fs-list-element="list"${instanceAttr}>
  <div class="static-list">
    <div class="list-item">
      <h3 class="item-title">Slide 1 Title</h3>
      <p class="item-description">Slide 1 description...</p>
      <img src="https://via.placeholder.com/300x200" alt="Slide 1" class="item-image">
    </div>
    <div class="list-item">
      <h3 class="item-title">Slide 2 Title</h3>
      <p class="item-description">Slide 2 description...</p>
      <img src="https://via.placeholder.com/300x200" alt="Slide 2" class="item-image">
    </div>
    <div class="list-item">
      <h3 class="item-title">Slide 3 Title</h3>
      <p class="item-description">Slide 3 description...</p>
      <img src="https://via.placeholder.com/300x200" alt="Slide 3" class="item-image">
    </div>
  </div>
</div>

<!-- Visible Slider Component -->
<div class="${config.sliderName}" fs-list-element="slider"${resetInteractionAttr}${instanceAttr}>
  <div class="slider w-slider">
    <div class="slider-mask w-slider-mask">
      <div class="slide w-slide">
        <!-- Slide content will be populated by Finsweet -->
      </div>
      <div class="slide w-slide">
        <!-- Slide content will be populated by Finsweet -->
      </div>
    </div>
    <div class="slider-arrow-left w-slider-arrow-left">
      <div class="arrow-icon">‹</div>
    </div>
    <div class="slider-arrow-right w-slider-arrow-right">
      <div class="arrow-icon">›</div>
    </div>
    <div class="slider-nav w-slider-nav w-round"></div>
  </div>
</div>`;
        }
    }

    generateRangeSliderHTML(config) {
        const handles = config.handles === 2 ? 
            `<div class="range-handle" fs-rangeslider-element="handle"></div>
      <div class="range-handle" fs-rangeslider-element="handle"></div>` :
            `<div class="range-handle" fs-rangeslider-element="handle"></div>`;

        const inputs = config.handles === 2 ? 
            `<input type="text" class="range-input" placeholder="Min">
  <input type="text" class="range-input" placeholder="Max">` :
            `<input type="text" class="range-input" placeholder="Value">`;

        const displayValues = config.handles === 2 ? 
            `<div class="range-display" fs-rangeslider-element="display-value"></div>
    <span>-</span>
    <div class="range-display" fs-rangeslider-element="display-value"></div>` :
            `<div class="range-display" fs-rangeslider-element="display-value"></div>`;

        const formatAttr = config.formatDisplay ? ` fs-rangeslider-formatdisplay="true"` : '';
        const updateAttr = config.updateMode !== 'move' ? ` fs-rangeslider-update="${config.updateMode}"` : '';

        return `<!-- Finsweet Range Slider -->
<div class="${config.sliderName}-wrapper" 
     fs-rangeslider-element="wrapper"
     fs-rangeslider-min="${config.minValue}"
     fs-rangeslider-max="${config.maxValue}"
     fs-rangeslider-step="${config.stepValue}"${formatAttr}${updateAttr}>
  
  <!-- Range Display -->
  <div class="range-display-wrapper">
    ${displayValues}
  </div>
  
  <!-- Range Slider Track -->
  <div class="range-track" fs-rangeslider-element="track">
    <div class="range-fill" fs-rangeslider-element="fill"></div>
    ${handles}
  </div>
  
  <!-- Hidden Inputs -->
  <div class="range-inputs" style="display: none;">
    ${inputs}
  </div>
</div>`;
    }

    generateCustomDotsHTML(config) {
        const removeAttr = config.removeOriginal ? ` fs-sliderdots-remove="true"` : '';
        const clearNavAttr = config.clearNav ? ` fs-sliderdots-remove="true"` : '';
        const activeClassAttr = config.activeClass !== 'is-active' ? ` fs-sliderdots-active="${config.activeClass}"` : '';

        let contentExample = '';
        switch (config.dotContent) {
            case 'image':
                contentExample = `<img src="https://via.placeholder.com/50x50" alt="Slide 1" class="dot-image" fs-sliderdots-element="content"${removeAttr}${activeClassAttr}>`;
                break;
            case 'custom':
                contentExample = `<div class="custom-dot" fs-sliderdots-element="content"${removeAttr}${activeClassAttr}>
    <span class="dot-number">1</span>
    <span class="dot-title">Slide Title</span>
  </div>`;
                break;
            default:
                contentExample = `<div class="text-dot" fs-sliderdots-element="content"${removeAttr}${activeClassAttr}>Slide 1</div>`;
        }

        return `<!-- Finsweet Custom Slider Dots -->
<!-- Main Slider -->
<div class="${config.sliderName}" fs-sliderdots-element="slider">
  <div class="slider w-slider">
    <div class="slider-mask w-slider-mask">
      <div class="slide w-slide">
        <h2>Slide 1 Content</h2>
        <!-- Content for each slide -->
        ${contentExample}
      </div>
      <div class="slide w-slide">
        <h2>Slide 2 Content</h2>
        <!-- Content for each slide -->
        ${contentExample.replace('1', '2').replace('Slide 1', 'Slide 2')}
      </div>
      <div class="slide w-slide">
        <h2>Slide 3 Content</h2>
        <!-- Content for each slide -->
        ${contentExample.replace('1', '3').replace('Slide 1', 'Slide 3')}
      </div>
    </div>
  </div>
</div>

<!-- Custom Dots Navigation -->
<div class="custom-dots-nav" fs-sliderdots-element="slider-nav"${clearNavAttr}>
  <!-- Custom dots will be populated here by Finsweet -->
</div>`;
    }

    generateFinsweetScript(solutions) {
        const solutionAttrs = solutions.map(s => `  ${s}`).join('\n');
        
        return `<!-- Add this script to your page <head> or before </body> -->
<script async type="module" 
  src="https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js"
${solutionAttrs}>
</script>`;
    }

    generateBasicSliderCSS(sliderName) {
        return `/* Basic Slider Styles */
.${sliderName} {
  margin-bottom: 2rem;
}

.slider {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.slide {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.item-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a202c;
}

.item-description {
  color: #718096;
  margin-bottom: 1rem;
}

.item-image {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}

.arrow-icon {
  font-size: 1.5rem;
  font-weight: bold;
  color: #4a5568;
}

/* Hide the original collection list */
.${sliderName.replace('-slider', '')}-list {
  display: none;
}`;
    }

    generateRangeSliderCSS(sliderName) {
        return `/* Range Slider Styles */
.${sliderName}-wrapper {
  padding: 2rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.range-display-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #2d3748;
}

.range-track {
  position: relative;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  margin: 1rem 0;
}

.range-fill {
  position: absolute;
  height: 100%;
  background: #667eea;
  border-radius: 3px;
  top: 0;
  left: 0;
}

.range-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #667eea;
  border: 2px solid white;
  border-radius: 50%;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.range-handle:hover {
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.range-inputs {
  margin-top: 1rem;
}

.range-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  margin-right: 0.5rem;
}`;
    }

    generateCustomDotsCSS(sliderName) {
        return `/* Custom Slider Dots Styles */
.${sliderName} .slide {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.custom-dots-nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
}

.text-dot,
.custom-dot {
  padding: 0.5rem 1rem;
  background: #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.text-dot:hover,
.custom-dot:hover {
  background: #cbd5e1;
}

.text-dot.is-active,
.custom-dot.is-active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.dot-image {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.dot-image:hover {
  transform: scale(1.05);
}

.dot-image.is-active {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.custom-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.dot-number {
  font-weight: 600;
  font-size: 0.875rem;
}

.dot-title {
  font-size: 0.75rem;
  opacity: 0.8;
}`;
    }

    updatePreview() {
        const previewArea = document.getElementById('preview-area');
        
        const previews = {
            'list-slider': this.generateListSliderPreview.bind(this),
            'range-slider': this.generateRangeSliderPreview.bind(this),
            'custom-dots': this.generateCustomDotsPreview.bind(this)
        };

        const preview = previews[this.currentTab]();
        previewArea.innerHTML = preview;
    }

    generateListSliderPreview() {
        const config = this.getListSliderConfig();
        return `
            <div style="text-align: center; padding: 1rem;">
                <h4 style="margin-bottom: 0.5rem; color: #374151;">${config.sliderName}</h4>
                <div style="background: #e2e8f0; padding: 1rem; border-radius: 6px; margin-bottom: 0.5rem;">
                    <div style="background: white; padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem;">
                        Slide Content (${config.dataSource === 'cms' ? 'CMS' : 'Static'})
                    </div>
                    <div style="display: flex; justify-content: center; gap: 0.25rem;">
                        <div style="width: 8px; height: 8px; background: #667eea; border-radius: 50%;"></div>
                        <div style="width: 8px; height: 8px; background: #cbd5e1; border-radius: 50%;"></div>
                        <div style="width: 8px; height: 8px; background: #cbd5e1; border-radius: 50%;"></div>
                    </div>
                </div>
                <small style="color: #6b7280;">
                    Items per slide: ${config.itemsPerSlide}
                    ${config.resetInteractions ? ' • Reset Interactions' : ''}
                </small>
            </div>
        `;
    }

    generateRangeSliderPreview() {
        const config = this.getRangeSliderConfig();
        const range = config.maxValue - config.minValue;
        const position = ((config.startValue - config.minValue) / range) * 100;
        
        return `
            <div style="padding: 1rem;">
                <h4 style="margin-bottom: 1rem; text-align: center; color: #374151;">${config.sliderName}</h4>
                <div style="margin-bottom: 1rem; text-align: center; font-weight: 600;">
                    ${config.handles === 2 ? `${config.minValue} - ${config.startValue}` : config.startValue}
                </div>
                <div style="position: relative; height: 6px; background: #e2e8f0; border-radius: 3px; margin: 1rem 0;">
                    <div style="position: absolute; height: 100%; background: #667eea; border-radius: 3px; width: ${position}%;"></div>
                    <div style="position: absolute; width: 16px; height: 16px; background: #667eea; border: 2px solid white; border-radius: 50%; top: 50%; left: ${position}%; transform: translate(-50%, -50%);"></div>
                    ${config.handles === 2 ? `<div style="position: absolute; width: 16px; height: 16px; background: #667eea; border: 2px solid white; border-radius: 50%; top: 50%; left: 80%; transform: translate(-50%, -50%);"></div>` : ''}
                </div>
                <small style="color: #6b7280; text-align: center; display: block;">
                    Range: ${config.minValue} - ${config.maxValue} (Step: ${config.stepValue})
                </small>
            </div>
        `;
    }

    generateCustomDotsPreview() {
        const config = this.getCustomDotsConfig();
        
        let dotPreview = '';
        switch (config.dotContent) {
            case 'image':
                dotPreview = `<div style="width: 30px; height: 30px; background: #667eea; border-radius: 4px;"></div>
                             <div style="width: 30px; height: 30px; background: #cbd5e1; border-radius: 4px;"></div>
                             <div style="width: 30px; height: 30px; background: #cbd5e1; border-radius: 4px;"></div>`;
                break;
            case 'custom':
                dotPreview = `<div style="padding: 0.5rem; background: #667eea; color: white; border-radius: 4px; font-size: 0.75rem;">1</div>
                             <div style="padding: 0.5rem; background: #cbd5e1; border-radius: 4px; font-size: 0.75rem;">2</div>
                             <div style="padding: 0.5rem; background: #cbd5e1; border-radius: 4px; font-size: 0.75rem;">3</div>`;
                break;
            default:
                dotPreview = `<div style="width: 12px; height: 12px; background: #667eea; border-radius: 50%;"></div>
                             <div style="width: 12px; height: 12px; background: #cbd5e1; border-radius: 50%;"></div>
                             <div style="width: 12px; height: 12px; background: #cbd5e1; border-radius: 50%;"></div>`;
        }
        
        return `
            <div style="padding: 1rem;">
                <h4 style="margin-bottom: 1rem; text-align: center; color: #374151;">${config.sliderName}</h4>
                <div style="background: #e2e8f0; padding: 1rem; border-radius: 6px; margin-bottom: 1rem; text-align: center;">
                    Slider Content
                </div>
                <div style="display: flex; justify-content: center; gap: 0.5rem; align-items: center;">
                    ${dotPreview}
                </div>
                <small style="color: #6b7280; text-align: center; display: block; margin-top: 0.5rem;">
                    Custom ${config.dotContent} dots • Active class: ${config.activeClass}
                </small>
            </div>
        `;
    }

    async copyToClipboard(type) {
        let textToCopy = '';
        
        if (type === 'html') {
            textToCopy = document.getElementById('html-code').textContent;
        } else if (type === 'script') {
            textToCopy = document.getElementById('script-code').textContent;
        } else if (type === 'css') {
            textToCopy = document.getElementById('css-code').textContent;
        } else if (type === 'all') {
            const html = document.getElementById('html-code').textContent;
            const script = document.getElementById('script-code').textContent;
            const css = document.getElementById('css-code').textContent;
            textToCopy = `<!-- HTML -->\n${html}\n\n<!-- CSS -->\n<style>\n${css}\n</style>\n\n<!-- JavaScript -->\n${script}`;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            this.showCopyFeedback(type);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            // Fallback for browsers that don't support clipboard API
            this.fallbackCopyToClipboard(textToCopy);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopyFeedback('fallback');
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        
        document.body.removeChild(textArea);
    }

    showCopyFeedback(type) {
        const button = document.getElementById(`copy-${type}`) || document.getElementById('copy-all');
        const originalText = button.textContent;
        
        button.textContent = 'Copied!';
        button.style.background = '#10b981';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    }
}

// Initialize the generator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FinsweetSliderGenerator();
});
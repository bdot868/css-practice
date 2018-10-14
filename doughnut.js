var classSet = React.addons.classSet;

var DonutChart = React.createClass({
  propTypes: {
    height: React.PropTypes.number,
    width: React.PropTypes.number,
    outerRadius: React.PropTypes.number,
    outerRadiusHover: React.PropTypes.number,
    innerRadius: React.PropTypes.number,
    innerRadiusHover: React.PropTypes.number,
    emptyWidth: React.PropTypes.number,
    total: React.PropTypes.number,
    defaultLabel: React.PropTypes.string,
    defaultValue: React.PropTypes.string,
    startAngle: React.PropTypes.number,
    stickyAngle: React.PropTypes.number, // stickyAngle
    series: React.PropTypes.oneOfType([
      React.PropTypes.arrayOf(React.PropTypes.shape({
      	data: React.PropTypes.number.isRequired,
      	className: React.PropTypes.string
    	}))
    ])
  },
  getDefaultProps() {
    return {
      height: 350,
      width: 350,
      outerRadius: 0.95,
      outerRadiusHover: 1,
      innerRadius: 0.85,
      innerRadiusHover: 0.85,
      emptyWidth: .06,
      total: null,
      startAngle: 0,
      defaultLabel: 'Income',
      defaultValue: '$0',
      onSelected: function(item) {},
      series: []
    };
  },
  render() {
    var { width, height } = this.props;

    return <svg className="DonutChart"
    	viewBox={`0 0 ${width} ${height}`}
			onClick={this.handleClick}>
      {this.renderPaths()}
      {this.renderText()}
    </svg>;
  },

	handleClick(e) {
		e.nativeEvent.stopImmediatePropagation();
	},

  renderPaths() {
    var total = parseFloat(this.props.total);
    var size = this.props.series.reduce((memo, item) => memo + item.data, 0);
    var startAngle = parseFloat(this.props.startAngle);
		var stickyAngle = parseFloat(this.props.stickyAngle);

		if (!isNaN(stickyAngle) && size !== total) {
			//alert(stickyAngle - (size / total * 360 / 2))
			startAngle = stickyAngle - (size / total * 360 / 2);
		}

    var series = this.props.series.map(item => {
      var path = item.selected ? this.renderSelectedPath(item, total, startAngle) :
				this.renderPath(item, total, startAngle);

      startAngle += item.data / total * 360;

      return path;
    });

		if (isNaN(total)) {
			total = 100;
      series.push(this.renderEmptyPath({ data: total }, total, startAngle));
		} else if (size < total) {
      series.push(this.renderEmptyPath({ data: total - size }, total, startAngle));
    }

    return series;
  },

  getTextEllipsis(text, maxWidth) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var svgNS = svg.namespaceURI;
    var newText = document.createElementNS(svgNS, "text");
    var textNode = document.createTextNode('...');
    var ellipsisWidth, textWidth;

		if (!text) { return; }

    newText.appendChild(textNode);
    svg.appendChild(newText);
    document.body.appendChild(svg);
    ellipsisWidth = newText.getSubStringLength(0, '...'.length);
    textNode.textContent = text;
    textWidth = newText.getSubStringLength(0, text.length);

    if (textWidth > maxWidth) {
      while (textWidth + ellipsisWidth > maxWidth) {
        text = text.slice(0, -1);
        textNode.textContent = text + '...';
        textWidth = newText.getSubStringLength(0, text.length);
      }
    }

    svg.remove();

    return textNode.textContent;
  },

  renderText() {
    var series = this.props.series.filter(item => item.selected);
    var selected = series.length ? series[0] : null;
    var label = selected ? selected.label : this.props.defaultLabel;
    var value = selected ? selected.value : this.props.defaultValue;

    return <g>
      <text className="DonutChart-label" x="50%" y="45%" text-align="middle">
        <tspan textAnchor="middle">{this.getTextEllipsis(label, 125)}</tspan>
				<title>{label}</title>
   	  </text>
      <text className="DonutChart-value" x="50%" y="60%" text-align="middle">
      	<tspan textAnchor="middle">{value}</tspan>
				<title>{value}</title>
   	  </text>
    </g>;
  },

  renderPath(item, total, startAngle) {
    var {className, props} = item;
    var classes = { 'DonutChart-path': true };
		var d = this.getPathData(item.data, total, startAngle, this.props.width, this.props.innerRadius, this.props.outerRadius);

    if (className) { classes[className] = true; }

  	return <path onClick={this.handleSelect.bind(this, item)} onMouseEnter={this.handleSelect.bind(this, item)}  className={classSet(classes)} {...props} d={d}></path>;
  },

	renderSelectedPath(item, total, startAngle) {
    var {className, props} = item;
		var classes = { 'DonutChart-path': true, 'DonutChart-path--selected': true };
		var d = this.getPathData(item.data, total, startAngle, this.props.width, this.props.innerRadiusHover, this.props.outerRadiusHover);

    if (className) { classes[className] = true; }

  	return <path className={classSet(classes)} {...props} d={d}></path>;
  },

  renderEmptyPath(item, total, startAngle) {
    var {className, props} = item;
    var classes = { 'DonutChart-path': true, 'DonutChart-path--empty': true };
		var d = this.getPathData(item.data, total, startAngle, this.props.width, this.props.innerRadius + 0.03, this.props.outerRadius - 0.03);

    if (className) { classes[className] = true; }

  	return <path className={classSet(classes)} {...props} d={d}></path>;
  },

	getPathData(data, total, startAngle, width, innerRadius, outerRadius) {
    var activeAngle = data / total * 360;
    var endAngle = startAngle + activeAngle;
    var largeArcFlagOuter = activeAngle > 180 ? '1 1' : '0 1';
    var largeArcFlagInner = activeAngle > 180 ? '1 0' : '0 0';
		var half = width / 2;
    var outerCoords = this.getCoordinates(half, outerRadius, startAngle, endAngle);
    var innerCoords = this.getCoordinates(half, innerRadius, startAngle, endAngle);

    return `M${outerCoords.x1},${outerCoords.y1}
    	${this.getArc(width, outerRadius, largeArcFlagOuter, outerCoords.x2, outerCoords.y2)}
    	L${innerCoords.x2},${innerCoords.y2}
    	${this.getArc(width, innerRadius, largeArcFlagInner, innerCoords.x1, innerCoords.y1)} z`;
	},

	toFixed(number, decimalPlaces) {
		decimalPlaces = decimalPlaces || 2;
		return (Math.floor(number * 100) / 100).toFixed(decimalPlaces);
	},

	getCoordinates(half, radius, startAngle, endAngle) {
    var x1 = this.toFixed(half + half * radius * Math.cos(Math.PI * startAngle / 180));
    var y1 = this.toFixed(half + half * radius * Math.sin(Math.PI * startAngle / 180));
    var x2 = this.toFixed(half + half * radius * Math.cos(Math.PI * endAngle / 180));
    var y2 = this.toFixed(half + half * radius * Math.sin(Math.PI * endAngle / 180));

		return { x1, y1, x2, y2 };
	},

  getArc(width, radius, largeArcFlag, x, y) {
    var z = this.toFixed(width / 2 * radius);

    return `A${z},${z} 0 ${largeArcFlag} ${this.toFixed(x)},${this.toFixed(y)}`;
  },

  handleSelect(item, e) {
    this.props.onSelected(item);
  }
});

var myChance = new Chance(Date.now());

var App = React.createClass({
  getInitialState() {
    return {
			showExamples: true,
      chartWidth: 12.25,
			defaultValue: '$6,282.32',
			total: 6282.32,
      series: [
        { label: 'Housing', value: '$1,208.84', data: 1208.84, selected: false },
        { label: 'Food', value: '$198.51', data: 198.51, selected: false },
        { label: 'Insurance', value: '$508.62', data: 508.62, selected: false },
        { label: 'Giving', value: '$628.23', data: 628.23, selected: false },
        { label: 'Transportation', value: '$1,208.84', data: 1208.84, selected: false },
        { label: 'Lifestyle', value: '$500.00', data: 500.00, selected: false },
        { label: 'Debt', value: '$2,029.28', data: 2029.28, selected: false }
      ]
    };
  },
  componentDidMount: function() {
    document.addEventListener("click", this.handleDocumentClick);
  },
  componentWillUnmount: function() {
    document.removeEventListener("click", this.handleDocumentClick);
  },
	handleDocumentClick(e) {
		this.setState({
			series: this.state.series.map(i => {
				i.selected = false;
				return i;
			}
		)});
	},
  handleSelected(item, e) {
    var series = this.state.series.map(i => {
      i.selected = i.label === item.label;
      return i;
    });

    this.setState({ series });
  },
	handleGo() {
    if (this.timeoutId) {
			clearTimeout(this.timeoutId);
		} else {
			this.timeoutId = setInterval(this.setRandomChartData, 500);
		}
	},
  setRandomChartData() {
		var groupNames = chance.pick(
			['Housing', 'Food', 'Insurance', 'Giving', 'Transportation', 'Lifestyle'],
			chance.integer({min: 0, max: 5})
		);
		var series = [], total = 0;

		groupNames.forEach(groupName => {
			var value = chance.floating({ min: 100, max: 1000 });

			series.push({
				label: groupName,
        value: `$${value.toFixed(2)}`,
        data: value,
        selected: false
			});
		});
    total = series.reduce((memo, g) => memo + g.data, 0);

		if (series.length && chance.bool()) {
			series = series.slice(0, series.length-1);
		}

		if (series.length && chance.bool()) {
			series[chance.integer({min: 0, max: series.length-1})].selected = true;
		}

		this.setState({ total, series });
	},
  handleToggleExamples(e) {
		e.preventDefault();
		this.setState({ showExamples: !this.state.showExamples });
	},
  handleChange(e) {
    e.nativeEvent.preventDefault();
		e.nativeEvent.stopPropagation();
    var nodes = [].slice.call(document.querySelectorAll('.DonutChart'));
    nodes = nodes.concat([].slice.call(document.querySelectorAll('.Message')));
		nodes.forEach(function(node) {
			node.style.width = e.target.value + 'rem';
			node.style.height = e.target.value + 'rem';
		});
		this.setState({ chartWidth: e.target.value });
	},
  render() {
		var charts = [];

    charts.push(<DonutChart defaultLabel="Income" defaultValue="$0" />);
    charts.push(<DonutChart defaultLabel="Income" defaultValue="$6,282.32" total="6282.32" />);
    charts.push(<DonutChart defaultLabel="Income" defaultValue="$6,282.32" total="6282.32" series={[
      { label: 'Housing', value: '$1,208.84', data: 1208.84 },
    ]} />);
    charts.push(<DonutChart defaultLabel="Income" defaultValue="$6,282.32" total="6282.32" series={[
      { label: 'Housing', value: '$1,208.84', data: 1208.84 },
      { label: 'Food', value: '$198.51', data: 198.51 }
    ]} />);
    charts.push(<DonutChart defaultLabel="Income" defaultValue="$6,282.32" total="6282.32" series={[
      { label: 'Housing', value: '$1,208.84', data: 1208.84 },
      { label: 'Food', value: '$198.51', data: 198.51 },
      { label: 'Insurance', value: '$508.62', data: 508.62 }
    ]} />);
    charts.push(<DonutChart defaultLabel="Income" defaultValue="$6,282.32" total="6282.32" series={[
      { label: 'Housing', value: '$1,208.84', data: 1208.84, selected: true },
      { label: 'Food', value: '$198.51', data: 198.51 },
      { label: 'Insurance', value: '$508.62', data: 508.62 },
      { label: 'Giving', value: '$628.23', data: 628.23 },
      { label: 'Transportation', value: '$1,208.84', data: 1208.84 },
      { label: 'Lifestyle', value: '$500.00', data: 500.00 },
      { label: 'Debt', value: '$2,029.28', data: 2029.28 }
    ]} />);
    charts.push(<DonutChart defaultLabel="Spent" defaultValue="$1,971.84" total="6282.32" startAngle="-90" series={[
      { label: 'Housing', value: '$1,208.84', data: 1208.84, className: 'DonutChart-path--spent' },
      { label: 'Food', value: '$198.51', data: 198.51, className: 'DonutChart-path--spent' },
      { label: 'Insurance', value: '$508.62', data: 508.62, className: 'DonutChart-path--spent' }
    ]} />);
    charts.push(<DonutChart defaultLabel="Spent" defaultValue="$1,971.84" total="6282.32" startAngle="-90" series={[
      { label: 'Housing', value: '$1,208.84', data: 1208.84, className: 'DonutChart-path--spent' },
      { label: 'Food', value: '$198.51', data: 198.51, selected: true, className: 'DonutChart-path--spent' },
      { label: 'Insurance', value: '$508.62', data: 508.62, className: 'DonutChart-path--spent' }
    ]} />);
    charts.push(<DonutChart defaultLabel="Remaining" defaultValue="$5,452.68" total="6282.32" series={[
      { label: 'Remaining', value: '$5,452.68', data: 5452.68, className: 'DonutChart-path--remaining' }
    ]} />);
    charts.push(<DonutChart defaultLabel="Really Long Default Label" defaultValue="$5,452.68" total="6282.32" series={[
      { label: 'Remaining', value: '$5,452.68', data: 5452.68, className: 'DonutChart-path--remaining' }
    ]} />);
		charts.push(<DonutChart defaultLabel="Sticky: -45" defaultValue="$5,452.68" total="6282.32" stickyAngle="-45" series={[
      { label: 'Sticky', value: '$5,452.68', data: 5452.68 }
    ]} />);
		charts.push(<DonutChart defaultLabel="Sticky: 135" defaultValue="$800.00" total="6282.32" stickyAngle="135" series={[
      { label: 'Sticky', value: '$5,452.68', data: 800.00 }
    ]} />);
		// charts = []; // todo - uncomment

    return <div id="app" onClick={this.handleClick}>
			<input className="DonutChart-range" type="range" min="10" max="30" value={this.state.chartWidth} step="1" onChange={this.handleChange} />
			<DonutChart {...this.state} onSelected={this.handleSelected} />
			<div className="Message">
				<p>The DonutChart on the left is interactive</p>
				<button onClick={this.handleGo}>GO</button>
			</div>
      {charts}
		</div>;
  }
});

React.render(<App />, document.querySelector('#output'));

// Unit Tests

var TestUtils = React.addons.TestUtils;

var renderElem = (props) => {
  var component = new DonutChart(props);
  return TestUtils.renderIntoDocument(component);
};

describe('DonutChart', () => {
  var component, props, element;

  beforeEach(() => {
    props = {};
  });

  describe('rendering', () => {
    it('should build the component', () => {
      component = renderElem(props);
      element = component.getDOMNode();

      expect(component).toBeTruthy();
      expect(element.classList.contains('DonutChart')).toBe(true);
    });

    it('should be a composite component', () => {
      component = renderElem(props);

      expect(TestUtils.isCompositeComponent(component)).toBe(true);
    });

    it('should not use a width/height attribute', () => {
      component = renderElem(props);
      element = component.getDOMNode();

      expect(element.getAttribute('width')).toBeFalsy();
      expect(element.getAttribute('height')).toBeFalsy();
		});

    it('should define a viewBox', () => {
      component = renderElem(props);
      element = component.getDOMNode();

      expect(element.getAttribute('viewBox')).toBe('0 0 350 350');
    });
	});

	describe('methods', () => {
		describe('toFixed', () => {
			it('should fix a number with no decimal values', () => {
  	    component = renderElem(props);

				expect(component.toFixed(100)).toBe('100.00');
			});

			it('should fix a number with 2 decimal values', () => {
	      component = renderElem(props);

				expect(component.toFixed(100.12)).toBe('100.12');
			});

			it('should fix a number with multiple decimal values', () => {
    	  component = renderElem(props);

				expect(component.toFixed(100.123456789)).toBe('100.12');
			});
		});

		describe('getTextEllipsis', () => {
			it('should not truncate small strings', () => {
	      component = renderElem(props);
				var smallString = 'small string';

				var text = component.getTextEllipsis(smallString, 100);
				expect(text).toBe(smallString);
			});

			it('should truncate long strings', () => {
	      component = renderElem(props);
				var longString = 'this is a really long string';

				var text = component.getTextEllipsis(longString, 100);
				expect(text).toBe('this is a real...');
			});
		});
	});

  describe('props', () => {
    it('should generate a path for each series if sum is equal to total', () => {
      props.total = 100;
      props.series = [{ data: 50 }, { data: 50 }];
      component = renderElem(props);
      element = component.getDOMNode();

      expect(element.querySelectorAll('path').length).toBe(2);
    });

    it('should generate an extra path is series sum is not equal to total', () => {
      props.total = 100;
      props.series = [{ data: 1 }, { data: 2 }];
      component = renderElem(props);
      element = component.getDOMNode();

      expect(element.querySelectorAll('path').length).toBe(3);
    });

		it('should generate one empty path if a series is not provided', () => {
      component = renderElem();
      element = component.getDOMNode();

      expect(element.querySelectorAll('.DonutChart-path--empty').length).toBe(1);
		});

		it('should generate one empty path if the total provided is NaN', () => {
      component = renderElem({ total: null, series: [{ data: 1 }, { data: 2 }] });
      element = component.getDOMNode();

      expect(element.querySelectorAll('.DonutChart-path--empty').length).toBe(1);
		});

		it('should generate a selcted path if one of the series items is selected', () => {
      component = renderElem({ total: 3, series: [{ data: 1 }, { data: 2, selected: true }] });
      element = component.getDOMNode();

      expect(element.querySelectorAll('.DonutChart-path--selected').length).toBe(1);
		});

    it('should apply an optional className if provided for each entry', () => {
      component = renderElem({ total: 3, series: [{ data: 1 }, { data: 2, className: 'DonutChart-path--spent' }] });
      element = component.getDOMNode();

      expect(element.querySelectorAll('.DonutChart-path--spent').length).toBe(1);
		});
  });
});

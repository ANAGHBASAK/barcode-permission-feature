import React, {Component} from "react";
import {LoadingText, SliderRow} from "./components/components";
import {connect} from "react-redux";
import {Box, Grid, Popover, Stack, Tab, Tabs, Tooltip} from "@mui/material";
import Button from "@mui/material/Button";
import {debounce, isNull} from "../../utils/utils";
import GridOverlay from "./headbar_apps/GridOverlay";
import Screenshot from "./headbar_apps/Screenshot";
import {brightnessKey, contrastKey} from "./utils/viewerSettingsKeys";
import Brightness6Icon from "@mui/icons-material/Brightness6";
import ContrastIcon from "@mui/icons-material/Contrast";
import {updateDisplaySetting, updateMapState} from "../../redux_actions/maps.state.action";
import PreviewMap from "./sidebarBottom_apps/preview";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import Barcode from "./sidebarBottom_apps/barcode";
import PreviewIcon from "@mui/icons-material/Preview";
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// FEATURE: Barcode Permission Control - imports
import {aclPermissions, hasPermissions} from "../../const/ACLPermissions";
import {barcodeApp} from "./app_maker";
import {checkAppPermission} from "./utils/gammaScanUtils";
// END FEATURE

class MobileGammaView extends Component {

    constructor(props) {
        super(props);

        this.state = this.initState();
    }

    initState = () => {
        return {
            anchorEl: null,
            setting: false,
            mobileAnchor: null,
            isAppOpen: false,
        }
    }

    componentDidMount = () => {
        // this.props.dispatch(loadDisplaySetting(this.props.activeMapId, this.props.slide.setting.display_setting));
        this.debounceFunc = debounce(this.resizeListener, 400)
        window.addEventListener("resize", this.debounceFunc);
    }
    componentWillUnmount = () => {
        window.removeEventListener("resize", this.debounceFunc);
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.activeMapId !== this.props.activeMapId && !this.props.displaySetting) {
            this.setState(this.initState());
            this.props.dispatch(updateMapState(this.props.activeMapId, {displaySetting: this.props.slide.display_setting}));
        }
    }

    resizeListener = () => {
        this.forceUpdate()
    }

    handleDropdownClose = (e) => {
        if (isNull(this.state.mobileAnchor))
            this.setState({mobileAnchor: e.currentTarget});
        else
            this.setState({mobileAnchor: null});
    };

    handleTabChange = (event, setting) =>
        this.setState({
            anchorEl: event.currentTarget,
            setting,
        });

    handleClose = () => {
        this.setState({
            anchorEl: null,
            setting: false
        });
    }

    toggleBarCodeWithPreview = () => {
        this.setState((prevState) => ({
            isAppOpen: !prevState.isAppOpen,
        }));
    }

    render() {

        if (!this.props.displaySetting)
            return <LoadingText/>;

        let open = Boolean(this.state.mobileAnchor);

        return (
            <Stack>
                <Grid marginLeft={"10px"}>
                    {open ? <GridOverlay/> : null}
                    {open ? <Screenshot/> : null}
                </Grid>
                <Stack sx={{width: "auto", height: "140px", position: "fixed", top: "50px", left: "10px"}}>
                    {this.state.isAppOpen ?
                        <Grid marginLeft={"20px"}><Barcode/></Grid> : <PreviewMap/>}
                </Stack>
                {/* FEATURE: Barcode Permission Control - conditionally render QrCode2Icon button */}
                {open && checkAppPermission(barcodeApp) ? <Button onClick={() => this.toggleBarCodeWithPreview()}>
                    {this.state.isAppOpen ? <PreviewIcon opacity={'0.8'} sx={{
                        backgroundColor: '#330470',
                        color: 'white',
                        borderRadius: '50px',
                        height: '40px',
                        width: '40px',
                        padding: '5px',
                        marginLeft: '5px'
                    }}/> : <QrCode2Icon opacity={'0.8'} sx={{
                        backgroundColor: '#330470',
                        color: 'white',
                        borderRadius: '50px',
                        height: '40px',
                        width: '40px',
                        padding: '5px',
                        marginLeft: '5px'
                    }}/>}
                </Button> : null}
                {/* END FEATURE */}
                {open ? <Tabs value={this.state.setting} onChange={this.handleTabChange} sx={{marginLeft: "10px"}}>
                    <Tooltip title={"Brightness"} placement={"bottom"} value={brightnessKey}>
                        <Tab icon={<Brightness6Icon opacity={'0.8'} sx={{
                            backgroundColor: '#330470',
                            borderRadius: '50px',
                            height: '40px',
                            width: '40px',
                            padding: '5px',
                            marginTop: '-7px'
                        }}/>} value={brightnessKey}/>
                    </Tooltip>
                </Tabs> : null}
                {open ? <Tabs value={this.state.setting} onChange={this.handleTabChange} sx={{marginLeft: "10px"}}>
                    <Tooltip title={"Contrast"} placement={"bottom"} value={contrastKey}>
                        <Tab icon={<ContrastIcon opacity={'0.8'} sx={{
                            backgroundColor: '#330470',
                            border: '10px',
                            borderRadius: '50px',
                            height: '40px',
                            width: '40px',
                            padding: '5px',
                            marginTop: '-10px'
                        }}/>} value={contrastKey}/>
                    </Tooltip>
                </Tabs> : null}
                <Popover open={!!this.state.anchorEl} anchorEl={this.state.anchorEl} onClose={this.handleClose}
                         anchorOrigin={{vertical: 'top', horizontal: 'right',}} sx={{width: 300, height: 93}}>
                    <Box width={200} paddingY={1} paddingX={2}>
                        <SliderRow value={this.props.displaySetting[this.state.setting.id]} hideInput={true}
                                   min={this.state.setting.min} max={this.state.setting.max}
                                   update={value => this.props.dispatch(updateDisplaySetting(this.props.activeMapId,
                                       {
                                           id: this.props.displaySetting.id,
                                           [this.state.setting.id]: value,
                                       }))}
                                   color={"sliderDefaultColor"}
                        />
                    </Box>
                </Popover>
                <Tooltip title={"Click to open more Tools"} placement={"bottom"}>
                    <Button id="drop-down" color={'secondary'}
                            onClick={this.handleDropdownClose}>
                        {!open ? <ExpandLessIcon opacity={'0.8'} sx={{
                                backgroundColor: '#330470',
                                borderRadius: '50px',
                                height: '50px',
                                width: '50px'
                            }}/> :
                            <ExpandMoreIcon opacity={'0.8'} sx={{
                                backgroundColor: '#330470',
                                borderRadius: '50px',
                                height: '50px',
                                width: '50px'
                            }}/>}
                    </Button>
                </Tooltip>
            </Stack>
        )
    }
}


const mapStateToProps = (state) => {
    let {activeMapId, lastMapCount} = state.gammaStateReducer;
    let mapState = state.mapsStateReducer[activeMapId];
    let {slide, displaySetting} = mapState ?? {};
    return {activeMapId, lastMapCount, slide, displaySetting, mapState};
};

export default connect(mapStateToProps)(MobileGammaView);

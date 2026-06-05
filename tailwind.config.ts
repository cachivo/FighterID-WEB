import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		screens: {
			'xs': '380px',
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
		},
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
		fontFamily: {
			'inter': ['Inter', 'sans-serif'],
			'barlow-condensed': ['Barlow Condensed', 'sans-serif'],
			'mono': [''Geist Mono'', 'JetBrains Mono', 'monospace'],
			'geist': [''Geist'', 'Inter', 'sans-serif'],
			'geist-mono': [''Geist Mono'', 'JetBrains Mono', 'monospace'],
		},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Urban-specific color tokens - neon purple theme
				'urban-gray': 'hsl(var(--urban-gray))',
				'urban-light': 'hsl(var(--urban-light))',
				'street-accent': 'hsl(var(--street-accent))',
				'purple-neon-primary': 'hsl(var(--purple-neon-primary))',
				'purple-neon-secondary': 'hsl(var(--purple-neon-secondary))',
				'purple-neon-glow': 'hsl(var(--purple-neon-glow))',
				'vote-active': 'hsl(var(--vote-active))',
				'vote-inactive': 'hsl(var(--vote-inactive))',
				
				// Professional Fighter Theme - Sober and masculine
				'fighter-primary': 'hsl(var(--fighter-primary))',
				'fighter-primary-foreground': 'hsl(var(--fighter-primary-foreground))',
				'fighter-secondary': 'hsl(var(--fighter-secondary))',
				'fighter-secondary-foreground': 'hsl(var(--fighter-secondary-foreground))',
				'fighter-accent': 'hsl(var(--fighter-accent))',
				'fighter-accent-foreground': 'hsl(var(--fighter-accent-foreground))',
				'fighter-background': 'hsl(var(--fighter-background))',
				'fighter-card': 'hsl(var(--fighter-card))',
				'fighter-border': 'hsl(var(--fighter-border))',
				'fighter-success': 'hsl(var(--fighter-success))',
				'fighter-warning': 'hsl(var(--fighter-warning))',
				'fighter-danger': 'hsl(var(--fighter-danger))',
				'fighter-info': 'hsl(var(--fighter-info))',
				'professional-primary': 'hsl(var(--professional-primary))',
				'professional-primary-foreground': 'hsl(var(--professional-primary-foreground))',
				'professional-secondary': 'hsl(var(--professional-secondary))',
				'professional-secondary-foreground': 'hsl(var(--professional-secondary-foreground))',
				'professional-accent': 'hsl(var(--professional-accent))',
				'professional-accent-foreground': 'hsl(var(--professional-accent-foreground))',
				'professional-muted': 'hsl(var(--professional-muted))',
				'professional-border': 'hsl(var(--professional-border))',
				'professional-danger': 'hsl(var(--professional-danger))',
				'professional-foreground': 'hsl(var(--professional-foreground))',
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-in-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(30px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scale-in': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'glow': {
					'0%': {
						boxShadow: '0 0 20px hsl(var(--primary) / 0.3)'
					},
					'50%': {
						boxShadow: '0 0 30px hsl(var(--primary) / 0.5)'
					},
					'100%': {
						boxShadow: '0 0 20px hsl(var(--primary) / 0.3)'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-20px)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s ease-out',
				'fade-in-up': 'fade-in-up 0.8s ease-out',
				'scale-in': 'scale-in 0.3s ease-out',
				'glow': 'glow 2s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
